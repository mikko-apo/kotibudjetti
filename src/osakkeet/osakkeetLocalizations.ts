export type Language = 'fi' | 'en'

export const FI = {
  languageSwitch: {
    label: 'Kieli',
  },
  intro: {
    title: 'IPO-laskuri osakkeille',
    description:
      'Laskee pääomanpalautusten kohdistuksen, hankintamenon jäljellä olevan määrän sekä IPO-myynnin verollisen ja nettomääräisen lopputuloksen.',
    unlistedDescription:
      'Tämä laskuri on tarkoitettu ennen listautumista olevalle listaamattomalle yhtiölle. IPO-päivästä eteenpäin varojenjako käsitellään tässä näkymässä osinkona.',
  },
  common: {
    rows: 'riviä',
    date: 'Päivä',
    amount: 'Määrä',
    type: 'Tyyppi',
    total: 'Yhteensä',
    remove: 'Poista',
  },
  assumptions: {
    title: 'Laskennan oletukset',
    items: [
      'Myynti kohdistetaan merkintäeriin FIFO-järjestyksessä.',
      'Ennen IPO-päivää tehdyt SVOP-varojenjaot käsitellään pääomanpalautuksena vain siltä osin kuin sama osakas saa takaisin omaa enintään 10 vuotta vanhaa sijoitustaan.',
      'IPO-päivänä tai sen jälkeen tehdyt varojenjaot käsitellään tässä laskurissa kokonaan osinkona.',
      'Listaamattoman yhtiön osingon verolajit lasketaan syötetyn osakkeiden matemaattisen arvon perusteella.',
      'Hankintameno-olettama vertaillaan jokaiselle käytetylle merkintäerälle erikseen.',
      'Pääomatulovero arvioidaan vain tämän myynnin perusteella vuoden 2026 30 % / 34 % verokannoilla.',
    ],
    sourcesLabel: 'Lähteet: ',
  },
  subscriptions: {
    title: 'Osakemerkinnät',
    help: 'Syötä kaikki merkintäerät omassa hankintajärjestyksessä. Myynnissä käytetään FIFO-periaatetta, ja IPO-päivän jälkeen päättyvä ansaintajakso estää merkintäerän myynnin.',
    fields: {
      vestingEndsOn: 'Ansaintajakso päättyy',
      totalPrice: 'Kokonaishinta',
      originalShareValue: 'Alkuperäinen osakkeen arvo',
      capitalRepaymentPerShare: 'Pääomanpalautus / osake',
      remainingCostPerShare: 'Jäljellä oleva hankintameno / osake',
    },
    summary: {
      totalShares: 'Osakkeita yhteensä',
      vestedShares: 'Ansaintajakson päättäneet osakkeet',
      unvestedShares: 'Ansaintajakson piirissä olevat osakkeet',
    },
    actions: {
      add: 'Lisää merkintä',
    },
  },
  cashDistributions: {
    title: 'Osingot ja pääomanpalautukset',
    help: 'Yhteensä ja maksettu käteisenä lasketaan automaattisesti osakekohtaisen määrän, omistuksen ja ennakonpidätyksen perusteella.',
    fields: {
      amountPerShare: '€/osake',
      withholding: 'Ennakko verottajalle',
      cashPaid: 'Maksettu käteisenä',
      capitalRepayment: 'Pääomanpalautus',
      dividend: 'Osinko',
    },
    actions: {
      add: 'Lisää varojenjako',
    },
    types: {
      capitalReturn: 'Pääomanpalautus',
      dividend: 'Osinko',
    },
  },
  ipo: {
    title: 'IPO-tiedot ja yhteenveto',
    fields: {
      ipoDate: 'IPO-päivä',
      totalShareCount: 'Osakkeiden kokonaismäärä',
      totalIpoCost: 'IPO-kulut yhteensä',
      currentShareValue: 'Nykyinen osakkeen arvo',
      currentTotalValue: 'Nykyinen kokonaisarvo',
      estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
      ipoSharePrice: 'IPO-hinta / osake',
      increasePercent: 'Nousu %',
      increaseMultiplier: 'Kerroin',
      secondarySellPercent: 'Arvioitu secondary-myynti %',
    },
    help: {
      secondary: 'Käytetään IPO-kulun allokointiin per myyty osake.',
      dateFormat: 'Muoto pp.kk.vvvv. Samaa päivää käytetään 10 vuoden hankintameno-olettaman tarkistukseen.',
    },
  },
  mathematicalShareValues: {
    title: 'Matemaattinen arvo / osake tunnetuille vuosille',
    fields: {
      year: 'Vuosi',
      valuePerShare: 'Arvo / osake',
    },
    actions: {
      add: 'Lisää vuosi',
    },
  },
  summary: {
    title: 'Yhteenveto',
    cards: {
      subscribedShares: 'Merkittyjä osakkeita ja omistusosuus',
      subscribedCost: 'Merkintöjen hankintameno',
      ipoPricePerShare: 'IPO-hinta / osake',
      currentValuePerShare: 'Nykyarvo / osake',
      ipoCostPerSecondaryShare: 'IPO-kulu / secondary-osake',
      secondarySharesTotal: 'Secondary-osakkeita yhteensä',
    },
    allocationByLot: {
      title: 'Myynnin kohdistus merkintäerille',
      fields: {
        distribution: 'Varojenjako',
        shares: 'Osakkeita',
        remainingPerShare: 'Jäljellä / osake',
      },
    },
    ipoSell: {
      title: 'IPO-myynnin tiedot',
      fields: {
        sharesToSell: 'Myytävien osakkeiden määrä',
        ipoPriceTotal: 'IPO-hinta yhteensä',
        actualCosts: 'Todelliset kulut',
        hmo20: 'HMO 20 %',
        hmo40: 'HMO 40 %',
        capitalGain: 'Luovutusvoitto',
        taxFreePart: 'Veroton osa',
        taxedPart: 'Verotettava osa',
      },
      summaryTitle: 'IPOn yhteenveto',
      cards: {
        grossSale: 'Myynti brutto',
        netCash: 'Käteen',
        taxMan: 'Verottajalle',
        ipoCostsAllocated: 'Kohdistetut IPO-kulut',
        taxableCapitalGain: 'Verotettava luovutusvoitto',
        sharesLeft: 'Osakkeita jäljelle',
        sellableShares: 'Myytävissä IPOssa',
        unvestedShares: 'Ei myytävissä IPOssa',
      },
      explanations: {
        title: 'Osakkeiden myyntihinta ja kulut',
        ipoPriceTotal: 'IPO-hinta yhteensä',
        ipoCostsAllocated: 'Kohdistetut IPO-kulut',
        netCash: 'Käteen ennen veroja',
        capitalGain: 'Luovutusvoitto',
        selectedDeductions: 'Luovutusvoittoa pienentävät vähennykset',
        taxOnCapitalGain: 'Veroihin varattava: arvioitu pääomatulovero luovutusvoitosta',
        deductibleIpoCosts: 'IPO-kulut todellisissa kuluissa',
        hmoIpoCosts: 'IPO-kulut HMO-erissä',
        ipoPriceTotalHelp: (gross: string) =>
          `IPO-hinta yhteensä on kaikkien myytyjen osakkeiden bruttohinta ${gross}.`,
        ipoCostsAllocatedHelp: (ipoCosts: string) =>
          `Kohdistetut IPO-kulut ${ipoCosts} vähennetään käteensä jäävästä summasta, vaikka ne eivät aina ole verotuksessa todellisia kuluja.`,
        netCashHelp: (gross: string, ipoCosts: string, net: string) =>
          `Käteen ennen vuotuista verotusta = IPO-hinta yhteensä ${gross} - kohdistetut IPO-kulut ${ipoCosts} = ${net}.`,
        capitalGainHelp: (net: string, acquisitionCosts: string, capitalGain: string) =>
          `Luovutusvoitto ${capitalGain} saadaan, kun IPO-hinta yhteensästä vähennetään verotuksessa käytetty hankintameno tai HMO ${acquisitionCosts}.`,
        selectedDeductionsHelp: (actual: string, hmo20: string, hmo40: string, total: string) =>
          `Valittu vähennys = todelliset kulut ${actual} + HMO 20 % ${hmo20} + HMO 40 % ${hmo40} = ${total}.`,
        taxOnCapitalGainHelp: (capitalGain: string, lowPart: string, highPart: string, tax: string) =>
          `Luovutusvoitto ${capitalGain} on tässä laskurissa verotettavaa pääomatuloa. Vuoden 2026 arvioitu pääomatulovero on 30 % ensimmäisestä 30 000 eurosta (${lowPart}) ja 34 % sen ylittävästä osasta (${highPart}). Veroihin varattava arvioitu pääomatulovero on yhteensä ${tax}.`,
        deductibleIpoCostsHelp: (ipoCosts: string, taxSaved: string) =>
          `Todellisiin kuluihin sisältyy IPO-kuluja ${ipoCosts}, mikä pienentää arvioitua veroa ${taxSaved}.`,
        hmoIpoCostsHelp: (ipoCosts: string) =>
          `HMO-erissä IPO-kuluja maksetaan ${ipoCosts}, mutta niitä ei käytetä todellisina kuluina verovähennyksessä.`,
      },
      capitalGainAnnualTax: {
        title: 'Luovutusvoiton laskeminen ja verottaminen vuositasolla',
        driversTitle: 'Voitot ja tappiot osakemyynneissä vuositasolla',
        driversHelp: (capitalGain: string) =>
          `Vuositasolla osakemyynneistä voi syntyä sekä luovutusvoittoja että luovutustappioita. Tässä laskelmassa syntyy luovutusvoittoa ${capitalGain}. Muut vuoden osakemyynnit voivat kuitenkin tuottaa luovutustappioita, jotka Verohallinnon ohjeen mukaan vähennetään saman vuoden luovutusvoitoista tai muista pääomatuloista verovuonna ja viitenä seuraavana vuonna.`,
      },
      cashReserve: {
        title: 'Tilille jäävä raha ja veroihin varattava osuus',
        keepAfterTaxes: 'Tilille voi jättää',
        reserveForTaxes: 'Veroihin varattava',
        taxPaymentStatus: 'Peritäänkö vero automaattisesti?',
        taxPaymentManual: 'Ei yleensä automaattisesti',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Tilille jäävä summa = käteen ${cash} - veroihin varattava osuus ${tax} = ${kept}.`,
        reserveForTaxesHelp: (tax: string) =>
          `Arvioitu vero ${tax} kannattaa varata erikseen, jotta vuotuinen verotus ei aiheuta yllättävää maksua.`,
        taxPaymentStatusHelp:
          'Verohallinnon ohjeen mukaan osakkeiden myyntivoiton verosta pitää yleensä huolehtia itse ennakkoverona tai lisäennakkona. Osingosta ennakonpidätys tehdään erikseen, mutta myyntivoitosta ei yleensä pidätetä veroa automaattisesti.',
      },
      saleResultComparison: {
        title: 'Merkintäkulut ja nettotulos',
        cardTitle: 'Myytyjen osakkeiden hankintameno ja nettotulos',
        value: (before: string, after: string, gain: string, percent: string) =>
          `Ennen pääomanpalautuksia ${before}, jälkeen pääomanpalautusten ${after}, nettotulos ${gain} (${percent}).`,
        help: (before: string, after: string, kept: string, gain: string, percent: string) =>
          `Myynnissä käytettyjen merkintäerien hankintameno ennen pääomanpalautuksia on ${before} ja pääomanpalautusten jälkeen ${after}. Tilille voi jättää ${kept}, joten nettotulos käytettyihin merkintäeriin nähden on ${gain} (${percent}).`,
      },
      ipoCostEffects: {
        title: 'IPO-kulujen vaikutus',
      },
      tooltips: {
        actualCosts: (realCostBasis: string, allocatedIpoCost: string, total: string) =>
          `Todelliset kulut = jäännöshankintameno ${realCostBasis} + kohdistettu IPO-kulu ${allocatedIpoCost} = ${total}.`,
        hmo: (gross: string, rate: string, deduction: string) =>
          `Hankintameno-olettama = IPO-hinta yhteensä ${gross} x ${rate} = ${deduction}.`,
      },
    },
    totalRow: 'Yhteensä',
  },
  taxReturns: {
    title: 'Yhteenveto veroilmoituksista',
    yearWarningMissingMathValue: 'Osinkoverotuksen jakoa ei voitu laskea ilman vuoden matemaattista arvoa / osake.',
    fields: {
      taxableCapitalIncome: 'Veronalaista pääomatuloa',
      taxFreeCapitalIncome: 'Verotonta pääomatuloa',
      taxableEarnedDividend: 'Veronalaista ansiotulo-osinkoa',
      taxFreeEarnedDividend: 'Verotonta ansiotulo-osinkoa',
      ipoSaleAllocation: 'IPO-myynnin jako',
    },
  },
  storage: {
    title: 'Tallennus',
    actions: {
      saveToLocalStorage: 'Tallenna selaimeen',
      loadSaved: 'Lataa tallennettu',
      saveFile: 'Tallenna tiedosto',
      loadFile: 'Lataa tiedosto',
      restoreExample: 'Palauta esimerkki',
      clearExample: 'Poista esimerkki',
    },
    status: {
      saved: 'Tallennettu',
      loaded: 'Ladattu',
      exampleRestored: 'Esimerkki palautettu',
      exampleCleared: 'Esimerkkidata poistettu',
      fileSaved: 'Tiedosto tallennettu',
    },
    errors: {
      invalidFile: 'Virheellinen tiedosto',
      fileReadFailed: 'Tiedoston luku epäonnistui',
    },
  },
  messages: {
    errorsTitle: 'Syötteissä on korjattavaa',
    warningsTitle: 'Huomiot',
  },
  sources: {
    dividends: 'Verohallinto: Osingot listaamattomasta yhtiöstä',
    form9a: 'Verohallinto: 9A täyttöohje',
    sales: 'Verohallinto: Osakkeiden myynti',
  },
  calculator: {
    validation: {
      negative: (field: string) => `${field} ei voi olla negatiivinen.`,
      invalidNumber: (field: string) => `${field} ei ole kelvollinen numero.`,
      invalidDate: (field: string) => `${field} ei ole kelvollinen pvm.`,
    },
    fields: {
      subscriptionAmount: (label: string) => `Merkintä ${label} määrä`,
      subscriptionTotalPrice: (label: string) => `Merkintä ${label} kokonaishinta`,
      subscriptionDate: (id: string) => `Merkintä ${id} päivä`,
      subscriptionVestingEndsOn: (id: string) => `Merkintä ${id} ansaintajakso päättyy`,
      mathematicalShareValueYear: (id: string) => `Matemaattinen arvo vuosi ${id}`,
      mathematicalShareValuePerShare: (id: string) => `Matemaattinen arvo/osake ${id}`,
      ipoDate: 'IPO-päivä',
      totalShareCount: 'Osakkeiden kokonaismäärä',
      totalIpoCost: 'IPO-kulut yhteensä',
      currentShareValue: 'Nykyinen osakkeen arvo',
      estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
      estimatedSecondaryShareSellPercentage: 'Arvioitu secondary-myyntiprosentti',
      sellAmount: 'Myytävien osakkeiden määrä',
      cashDistributionDate: (id: string) => `Varojenjako ${id} päivä`,
      cashDistributionAmountPerShare: (id: string) => `Varojenjako ${id} €/osake`,
    },
    warnings: {
      totalShareCountBelowSubscriptions:
        'Osakkeiden kokonaismäärä on pienempi kuin syötettyjen merkintöjen yhteismäärä.',
      secondarySellPercentZero: 'Secondary-myyntiprosentti on 0, joten IPO-kulu/osake on jaettu koko osakemäärälle.',
      noSharesHeldForDistribution: (date: string) => `Varojenjaolle ${date} ei löytynyt omistettuja osakkeita.`,
      sellAmountExceedsEstimatedSecondary: 'Myyntimäärä ylittää arvioidun secondary-myyntimäärän koko yhtiön tasolla.',
      vestingBlockedWithoutIpoDate:
        'IPO-päivä puuttuu, joten ansaintajakson rajoittamia merkintäeriä ei voitu ottaa mukaan myyntiin.',
    },
    errors: {
      sellAmountExceedsSellable: (shares: string) =>
        `Myytävien osakkeiden määrä ylittää IPO-päivänä myytävissä olevien osakkeiden määrän (${shares}).`,
    },
  },
}

export const EN: typeof FI = {
  languageSwitch: {
    label: 'Language',
  },
  intro: {
    title: 'IPO calculator for shares',
    description:
      'Calculates how capital repayments are allocated, how acquisition cost remains, and what the IPO sale produces before and after tax.',
    unlistedDescription:
      'This calculator is intended for an unlisted company before listing. From the IPO date onward, distributions are treated as dividends in this view.',
  },
  common: {
    rows: 'rows',
    date: 'Date',
    amount: 'Amount',
    type: 'Type',
    total: 'Total',
    remove: 'Remove',
  },
  assumptions: {
    title: 'Calculation assumptions',
    items: [
      'Sales are allocated to subscription lots using FIFO.',
      'Before the IPO date, distributions from invested unrestricted equity are treated as capital repayment only to the extent the same shareholder gets back their own investment made within the last 10 years.',
      'On and after the IPO date, distributions are treated as dividends in this calculator.',
      'Tax categories for dividends from an unlisted company are calculated using the entered mathematical value per share for each year.',
      'The deemed acquisition cost is compared separately for each subscription lot used in the sale.',
      'Capital income tax is estimated only for this sale using the 2026 30% / 34% rates.',
    ],
    sourcesLabel: 'Sources: ',
  },
  subscriptions: {
    title: 'Share subscriptions',
    help: 'Enter all subscription lots in acquisition order. FIFO is used for sales, and a vesting period ending after the IPO date blocks that lot from being sold.',
    fields: {
      vestingEndsOn: 'Vesting ends',
      totalPrice: 'Total price',
      originalShareValue: 'Original share value',
      capitalRepaymentPerShare: 'Capital repayment / share',
      remainingCostPerShare: 'Remaining acquisition cost / share',
    },
    summary: {
      totalShares: 'Total shares',
      vestedShares: 'Vested shares',
      unvestedShares: 'Unvested shares',
    },
    actions: {
      add: 'Add subscription',
    },
  },
  cashDistributions: {
    title: 'Dividends and capital repayments',
    help: 'Total amount and cash paid are calculated automatically from the per-share amount, holdings, and withholding.',
    fields: {
      amountPerShare: 'EUR / share',
      withholding: 'To tax office in advance',
      cashPaid: 'Paid in cash',
      capitalRepayment: 'Capital repayment',
      dividend: 'Dividend',
    },
    actions: {
      add: 'Add distribution',
    },
    types: {
      capitalReturn: 'Capital repayment',
      dividend: 'Dividend',
    },
  },
  ipo: {
    title: 'IPO details and summary',
    fields: {
      ipoDate: 'IPO date',
      totalShareCount: 'Total share count',
      totalIpoCost: 'Total IPO costs',
      currentShareValue: 'Current share value',
      currentTotalValue: 'Current total value',
      estimatedPreIpoValue: 'Estimated pre-IPO value',
      ipoSharePrice: 'IPO share price',
      increasePercent: 'Increase %',
      increaseMultiplier: 'Multiplier',
      secondarySellPercent: 'Estimated secondary sell %',
    },
    help: {
      secondary: 'Used to allocate IPO cost per sold share.',
      dateFormat:
        'Format dd.mm.yyyy. The same date is used when checking eligibility for the 10-year deemed acquisition cost.',
    },
  },
  mathematicalShareValues: {
    title: 'Mathematical value / share for known years',
    fields: {
      year: 'Year',
      valuePerShare: 'Value / share',
    },
    actions: {
      add: 'Add year',
    },
  },
  summary: {
    title: 'Summary',
    cards: {
      subscribedShares: 'Subscribed shares and ownership share',
      subscribedCost: 'Subscription acquisition cost',
      ipoPricePerShare: 'IPO price / share',
      currentValuePerShare: 'Current value / share',
      ipoCostPerSecondaryShare: 'IPO cost / secondary share',
      secondarySharesTotal: 'Secondary shares total',
    },
    allocationByLot: {
      title: 'Sale allocation by subscription lot',
      fields: {
        distribution: 'Distribution',
        shares: 'Shares',
        remainingPerShare: 'Remaining / share',
      },
    },
    ipoSell: {
      title: 'IPO sell details',
      fields: {
        sharesToSell: 'Number of shares to sell',
        ipoPriceTotal: 'Total IPO price',
        actualCosts: 'Actual costs',
        hmo20: 'HMO 20%',
        hmo40: 'HMO 40%',
        capitalGain: 'Capital gain',
        taxFreePart: 'Tax-free part',
        taxedPart: 'Taxed part',
      },
      summaryTitle: 'IPO summary',
      cards: {
        grossSale: 'Gross sale',
        netCash: 'In cash',
        taxMan: 'To tax man',
        ipoCostsAllocated: 'Allocated IPO costs',
        taxableCapitalGain: 'Taxable capital gain',
        sharesLeft: 'Shares remaining',
        sellableShares: 'Sellable at IPO',
        unvestedShares: 'Unvested at IPO',
      },
      explanations: {
        title: 'Share sale price and costs',
        ipoPriceTotal: 'Total IPO price',
        ipoCostsAllocated: 'Allocated IPO costs',
        netCash: 'Cash before taxes',
        capitalGain: 'Capital gain',
        selectedDeductions: 'Deductions reducing capital gain',
        taxOnCapitalGain: 'Reserve for taxes: estimated capital income tax on capital gain',
        deductibleIpoCosts: 'IPO costs inside actual costs',
        hmoIpoCosts: 'IPO costs in HMO lots',
        ipoPriceTotalHelp: (gross: string) => `Total IPO price is the gross price of all sold shares: ${gross}.`,
        ipoCostsAllocatedHelp: (ipoCosts: string) =>
          `Allocated IPO costs ${ipoCosts} reduce the cash you keep, even though they are not always used as actual-cost deductions in taxation.`,
        netCashHelp: (gross: string, ipoCosts: string, net: string) =>
          `Cash before annual taxation = total IPO price ${gross} - allocated IPO costs ${ipoCosts} = ${net}.`,
        capitalGainHelp: (net: string, acquisitionCosts: string, capitalGain: string) =>
          `Capital gain ${capitalGain} is obtained by subtracting the tax deduction basis ${acquisitionCosts} from the total IPO price.`,
        selectedDeductionsHelp: (actual: string, hmo20: string, hmo40: string, total: string) =>
          `Selected deduction = actual costs ${actual} + HMO 20% ${hmo20} + HMO 40% ${hmo40} = ${total}.`,
        taxOnCapitalGainHelp: (capitalGain: string, lowPart: string, highPart: string, tax: string) =>
          `In this calculator, capital gain ${capitalGain} is taxable capital income. Estimated 2026 capital income tax is 30% on the first 30,000 euros (${lowPart}) and 34% on the part above that (${highPart}). The estimated capital income tax to reserve is ${tax}.`,
        deductibleIpoCostsHelp: (ipoCosts: string, taxSaved: string) =>
          `Actual-cost lots include IPO costs ${ipoCosts}, reducing estimated tax by ${taxSaved}.`,
        hmoIpoCostsHelp: (ipoCosts: string) =>
          `In HMO lots, IPO costs ${ipoCosts} are still paid but not used as actual-cost deductions.`,
      },
      capitalGainAnnualTax: {
        title: 'Capital gain calculation and annual taxation',
        driversTitle: 'Wins and losses from share sales over the tax year',
        driversHelp: (capitalGain: string) =>
          `Over a tax year, share sales can create both capital gains and capital losses. In this calculation, the result is capital gain ${capitalGain}. Other share sales during the year may still create capital losses which, according to Finnish Tax Administration guidance, are deducted from capital gains of the same year or from other capital income in the tax year and the following five years.`,
      },
      cashReserve: {
        title: 'Cash you can keep and amount to reserve for taxes',
        keepAfterTaxes: 'Can stay in your account',
        reserveForTaxes: 'Reserve for taxes',
        taxPaymentStatus: 'Is tax withheld automatically?',
        taxPaymentManual: 'Usually not automatically',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Amount left in your account = cash ${cash} - amount reserved for taxes ${tax} = ${kept}.`,
        reserveForTaxesHelp: (tax: string) =>
          `It is prudent to reserve the estimated tax ${tax} separately so annual taxation does not create an unexpected payment.`,
        taxPaymentStatusHelp:
          'According to the Finnish Tax Administration, you usually need to take care of tax on share-sale gains yourself as prepayment or additional prepayment. Dividend withholding is handled separately, but share-sale gain tax is usually not withheld automatically.',
      },
      saleResultComparison: {
        title: 'Subscription cost and net result',
        cardTitle: 'Acquisition cost of sold shares and net result',
        value: (before: string, after: string, gain: string, percent: string) =>
          `Before reimbursements ${before}, after reimbursements ${after}, net result ${gain} (${percent}).`,
        help: (before: string, after: string, kept: string, gain: string, percent: string) =>
          `The acquisition cost of the subscription lots used in the sale is ${before} before reimbursements and ${after} after reimbursements. You can keep ${kept}, so the net result against the sold subscription lots is ${gain} (${percent}).`,
      },
      ipoCostEffects: {
        title: 'Effect of IPO costs',
      },
      tooltips: {
        actualCosts: (realCostBasis: string, allocatedIpoCost: string, total: string) =>
          `Actual costs = remaining acquisition cost ${realCostBasis} + allocated IPO cost ${allocatedIpoCost} = ${total}.`,
        hmo: (gross: string, rate: string, deduction: string) =>
          `Deemed acquisition cost = total IPO price ${gross} x ${rate} = ${deduction}.`,
      },
    },
    totalRow: 'Total',
  },
  taxReturns: {
    title: 'Tax return summary',
    yearWarningMissingMathValue:
      'Dividend tax split could not be calculated without the year-specific mathematical value / share.',
    fields: {
      taxableCapitalIncome: 'Taxable capital income',
      taxFreeCapitalIncome: 'Tax-free capital income',
      taxableEarnedDividend: 'Taxable earned-income dividend',
      taxFreeEarnedDividend: 'Tax-free earned-income dividend',
      ipoSaleAllocation: 'IPO sale allocation',
    },
  },
  storage: {
    title: 'Storage',
    actions: {
      saveToLocalStorage: 'Save to browser',
      loadSaved: 'Load saved',
      saveFile: 'Save file',
      loadFile: 'Load file',
      restoreExample: 'Restore example',
      clearExample: 'Clear example',
    },
    status: {
      saved: 'Saved',
      loaded: 'Loaded',
      exampleRestored: 'Example restored',
      exampleCleared: 'Example data cleared',
      fileSaved: 'File saved',
    },
    errors: {
      invalidFile: 'Invalid file',
      fileReadFailed: 'File read failed',
    },
  },
  messages: {
    errorsTitle: 'There are issues in the inputs',
    warningsTitle: 'Warnings',
  },
  sources: {
    dividends: 'Tax Admin: Dividends from an unlisted company',
    form9a: 'Tax Admin: Form 9A instructions',
    sales: 'Tax Admin: Sale of shares',
  },
  calculator: {
    validation: {
      negative: (field: string) => `${field} cannot be negative.`,
      invalidNumber: (field: string) => `${field} is not a valid number.`,
      invalidDate: (field: string) => `${field} is not a valid date.`,
    },
    fields: {
      subscriptionAmount: (label: string) => `Subscription ${label} amount`,
      subscriptionTotalPrice: (label: string) => `Subscription ${label} total price`,
      subscriptionDate: (id: string) => `Subscription ${id} date`,
      subscriptionVestingEndsOn: (id: string) => `Subscription ${id} vesting ends`,
      mathematicalShareValueYear: (id: string) => `Mathematical value year ${id}`,
      mathematicalShareValuePerShare: (id: string) => `Mathematical value/share ${id}`,
      ipoDate: 'IPO date',
      totalShareCount: 'Total share count',
      totalIpoCost: 'Total IPO costs',
      currentShareValue: 'Current share value',
      estimatedPreIpoValue: 'Estimated pre-IPO value',
      estimatedSecondaryShareSellPercentage: 'Estimated secondary sell percentage',
      sellAmount: 'Number of shares to sell',
      cashDistributionDate: (id: string) => `Distribution ${id} date`,
      cashDistributionAmountPerShare: (id: string) => `Distribution ${id} EUR/share`,
    },
    warnings: {
      totalShareCountBelowSubscriptions: 'Total share count is lower than the total amount of entered subscriptions.',
      secondarySellPercentZero:
        'Secondary sell percentage is 0, so IPO cost/share has been divided across the full share count.',
      noSharesHeldForDistribution: (date: string) => `No held shares were found for the distribution on ${date}.`,
      sellAmountExceedsEstimatedSecondary:
        'Sell amount exceeds the estimated secondary sell amount at whole-company level.',
      vestingBlockedWithoutIpoDate:
        'IPO date is missing, so vesting-restricted subscription lots were excluded from the sale.',
    },
    errors: {
      sellAmountExceedsSellable: (shares: string) =>
        `The number of shares to sell exceeds the shares sellable on the IPO date (${shares}).`,
    },
  },
}

export type OsakkeetLocalization = typeof FI

export function getOsakkeetLocalization(language: Language) {
  return language === 'en' ? EN : FI
}
