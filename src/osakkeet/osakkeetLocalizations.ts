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
    warningsTitle: 'Varoitukset',
    warnings: [
      'Laskuri ei tue yritysten sulautumisia eikä jakautumisia.',
      'Laskuria ei ole vielä testattu kattavasti ihmisten toimesta.',
      'Todellisiin rahallisiin päätöksiin kannattaa käyttää ammattilaispalvelua. Tämä ei ole sellainen.',
    ],
    securityTitle: 'Tietoturva ja vastuunvapautus',
    securityText:
      'Tämä sovellus on avointa lähdekoodia ja vapaasti käytettävissä, mutta kehittäjä ei ota minkäänlaista siitä, että sovellus olisi turvallinen, virheetön tai ilmainen käyttää.',
    securityAdditionalText: 'Tämä sovellus toimii vain selaimessa. Se ei lähetä tietojasi minnekään.',
    securityNote: 'Huom: URL-osoitteissa välitetyt tiedot voivat näkyä muille.',
    securityIssues:
      'Jos havaitset virheitä tai keksit parannusehdotuksia, koosta yksinkertainen testitapaus ja lisää havainto osoitteeseen https://github.com/mikko-apo/kotibudjetti/issues',
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
      pricePerShare: 'Hinta / osake',
      otherTotalAcquisitionCosts: 'Muut hankintamenot yhteensä',
      otherTotalAcquisitionCostsHelp:
        'Syötä tähän esimerkiksi varainsiirtovero, merkintään liittyvät palkkiot ja muut hankinnasta aiheutuneet kulut. Älä syötä tähän tulonhankkimisvelan korkoja, vaan ilmoita ne vuosiverotuksessa kohdassa pääomatuloista tehtävät vähennykset.',
      totalPricePerShare: 'Kokonaishankintameno / osake',
      totalReimbursements: 'Pääomanpalautukset yhteensä',
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
      shareCount: 'Osakkeita yhteensä',
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
    messages: {
      shareCountMismatch: (expected: string, given: string) =>
        `Osakemäärä ei täsmää merkintöihin tällä päivällä. Odotettu ${expected}, annettu ${given}.`,
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
        hmo: 'Hankintameno-olettama',
        capitalGain: 'Luovutusvoitto',
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
        capitalGain: 'Luovutusvoitto IPOsta',
        selectedDeductions: 'Luovutusvoittoa pienentävät vähennykset',
        taxOnCapitalGain: 'Veroihin varattava: arvioitu pääomatulovero luovutusvoitosta',
        deductibleIpoCosts: 'Todellisten kulujen IPO-kulujen vaikutus verotuksessa',
        hmoIpoCosts: 'Hallintameno-olettamuksen kanssa IPO-kuluja ei huomioida',
        ipoPriceTotalHelp: (gross: string) =>
          `IPO-hinta yhteensä on kaikkien myytyjen osakkeiden bruttohinta ${gross}.`,
        ipoCostsAllocatedHelp: (ipoCosts: string) =>
          `Kohdistetut IPO-kulut ${ipoCosts} vähennetään osakkeiden myyntihinnasta. Ne voivat olla välittäjän kuluja yms. Niiden osakkeiden osalta joiden kohdalla käytetään todellisia kuluja, kohdistetut IPO-kulut lisätään osakekohtaisesti todellisiin kuluihin tässä laskurissa.`,
        netCashHelp: (gross: string, ipoCosts: string, net: string) =>
          `Käteen ennen vuotuista verotusta = IPO-hinta yhteensä ${gross} - kohdistetut IPO-kulut ${ipoCosts} = ${net}.`,
        capitalGainHelp: (gross: string, acquisitionCosts: string) =>
          `Luovutusvoitto lasketaan vähentämällä "IPO-hinta yhteensä" summasta "Luovutusvoittoa pienentävät vähennykset": ${gross} - ${acquisitionCosts}.`,
        selectedDeductionsHelp: (actual: string, hmo: string) =>
          `Todelliset kulut ${actual} + hankintameno-olettama ${hmo}.`,
        taxOnCapitalGainHelp: (capitalGain: string, lowPart: string, highPart: string, tax: string) =>
          `Luovutusvoitto ${capitalGain} on tässä laskurissa verotettavaa pääomatuloa. Vuoden 2026 arvioitu pääomatulovero on 30 % ensimmäisestä 30 000 eurosta (${lowPart}) ja 34 % sen ylittävästä osasta (${highPart}). Veroihin varattava arvioitu pääomatulovero on yhteensä ${tax}.`,
        deductibleIpoCostsHelp: (ipoCosts: string, taxSaved: string) =>
          `Todellisiin kuluihin sisältyy IPO-kuluja ${ipoCosts}, mikä pienentää arvioitua veroa ${taxSaved}.`,
        hmoIpoCostsHelp: () => 'HMO-erissä IPO-kuluja ei voi merkitä vähennyksiksi.',
      },
      capitalGainAnnualTax: {
        title: 'Luovutusvoiton laskeminen ja verottaminen vuositasolla',
        driversTitle: 'Voitot ja tappiot osakemyynneissä vuositasolla',
        driversValue: '',
        driversHelp:
          'Vuosittaisessa verotuksessa kaikki luovutusvoitot ja luovutustappiot lasketaan lopuksi yhteen ja kertyneen "Luovutusvoiton" määrä määrittää "Luovutusvoiton veron" määrän. Seuraavaksi lasketaan kuinka paljon "Luovutusvoiton veroa" muodostuu jos tämä on ainoa osakekauppa mitä teet.',
      },
      cashReserve: {
        title: 'Tilille jäävä raha ja veroihin varattava osuus',
        otherAnnualCapitalGainsOrLosses: 'Muut luovutusvoitot tai tappiot',
        otherAnnualCapitalGainsOrLossesHelp: 'Syötä kenttään muut mahdolliset luovutusvoitot ja tappiot',
        annualAdjustmentTitle: 'Muiden luovutusvoittojen tai -tappioiden vaikutus vuositasolla',
        annualAdjustedKeepAfterTaxes: 'Tilille voi jättää vuositasolla',
        annualAdjustedReserveForTaxes: 'Veroihin varattava vuositasolla',
        keepAfterTaxes: 'Tilille voi jättää',
        reserveForTaxes: 'Veroihin varattava',
        taxEffectFromOtherAnnualCapital: 'Muiden luovutusvoittojen tai -tappioiden vaikutus veroon',
        taxPaymentStatus: 'Peritäänkö vero automaattisesti?',
        taxPaymentManual: 'Ei yleensä automaattisesti',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Tilille jäävä summa = käteen ${cash} - veroihin varattava osuus ${tax} = ${kept}.`,
        reserveForTaxesHelp: (tax: string) =>
          `Arvioitu vero ${tax} kannattaa varata erikseen, jotta vuotuinen verotus ei aiheuta yllättävää maksua.`,
        taxEffectFromOtherAnnualCapitalHelp: (other: string, reduction: string, increase: string) =>
          `Anna tähän vuoden muiden luovutusvoittojen tai luovutustappioiden yhteisvaikutus. Syötetty muutos ${other}. Negatiivinen arvo pienentää veroarviota ${reduction}. Positiivinen arvo kasvattaa veroarviota ${increase}. Tappiolla olevien osakkeiden myynti voi pienentää veroa, mutta välitöntä takaisinostoa ei kannata tehdä pelkästään verotussyystä ilman ammattilaisen arviota.`,
        annualAdjustedKeepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Vuositasolla tilille jäävä summa = käteen ${cash} - vuositasolla veroihin varattava osuus ${tax} = ${kept}.`,
        annualAdjustedReserveForTaxesHelp: (tax: string) =>
          `Kun muut luovutusvoitot tai luovutustappiot huomioidaan, vuositasolla varattava vero on ${tax}.`,
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
      saveToBrowserStorage: 'Tallenna selaimeen pysyvästi',
      loadFromBrowserStorage: 'Lataa selaimesta',
      removeFromBrowserStorage: 'Poista selaimesta',
      copyShareUrl: 'Kopioi yrityksen tiedot URL:iin',
      saveFile: 'Tallenna',
      loadFile: 'Lataa tiedosto',
      showExample: 'Näytä esimerkki',
      clearExample: 'Tyhjennä',
    },
    table: {
      rowTitle: 'Toiminto',
      descriptionTitle: 'Kuvaus',
      actionsTitle: 'Painikkeet',
      autoSaveTitle: 'Automaattinen tallennus',
      autoSaveDescription:
        'Sovellus tallentaa syötteet automaattisesti selainikkunan omaan tallennustilaan, joten sivun päivitys säilyttää tiedot. Jos selainikkuna suljetaan, nämä tiedot katoavat.',
      fileTitle: 'Tallenna tiedosto tietokoneelle',
      fileDescription: 'Voit ladata syötetyt tiedot tietokoneellesi JSON tiedostona.',
      browserTitle: 'Tallenna tiedot selaimeen',
      browserDescription:
        'Voit tallentaa tiedot selaimen muistiin. Tieto tulee automaattisesti käyttöön jos sivu ladataan uuteen selainikkunaan.',
      clearTitle: 'Tyhjennä luvut',
      clearDescription:
        'Voit tyhjentää syötetyt lukemat, mutta se ei poista selaimeen talletettua tietoa tai ladattuja tiedostoja.',
      exampleTitle: 'Näytä esimerkki-tilanne',
      exampleDescription: 'Voit tutkia miltä sovellus näyttää esimerkkidatalla.',
    },
    copyShareUrlHelp: 'Tällä voi jakaa yhtiön tiedot ja varojenjaot toisille.',
    copyShareUrlNote: 'Huom: URL-osoitteissa välitetyt tiedot voivat näkyä muille.',
    status: {
      saved: 'Tallennettu automaattisesti',
      browserSaved: 'Tallennettu selaimeen pysyvästi',
      browserLoaded: 'Ladattu selaimen pysyvästä tallennuksesta',
      browserRemoved: 'Selaimen pysyvä tallennus poistettu',
      shareUrlCopied: 'URL kopioitu',
      loaded: 'Ladattu',
      exampleShown: 'Esimerkki näytetty',
      exampleCleared: 'Esimerkkidata poistettu',
      fileSaved: 'Tiedosto tallennettu',
    },
    errors: {
      invalidFile: 'Virheellinen tiedosto',
      fileReadFailed: 'Tiedoston luku epäonnistui',
      clipboardFailed: 'Kopiointi epäonnistui',
    },
    confirmations: {
      clearExample: 'Tyhjennetäänkö kaikki nykyiset tiedot?',
    },
    saveIndicators: {
      browserNeedsSave: 'Syötteitä on muutettu eikä niitä ole tallennettu selaimen pysyvään tallennukseen.',
      browserSaved: 'Selaimen pysyvä tallennus on ajan tasalla.',
      browserLoadUnavailable: 'Selaimen pysyvässä tallennuksessa ei ole tietoja ladattavaksi.',
      fileNeedsSave: 'Syötteitä on muutettu eikä niitä ole tallennettu tiedostoon tässä ikkunassa.',
      fileSaved: 'Tiedostotallennus on ajan tasalla tässä ikkunassa.',
    },
  },
  messages: {
    errorsTitle: 'Syötteissä on korjattavaa',
    warningsTitle: 'Huomiot',
  },
  sources: {
    dividends: 'Verohallinto: Osingot listaamattomasta yhtiöstä',
    listedDividends: 'Verohallinto: Osingot listatusta yhtiöstä',
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
      subscriptionPricePerShare: (label: string) => `Merkintä ${label} hinta/osake`,
      subscriptionOtherTotalAcquisitionCosts: (label: string) => `Merkintä ${label} muut hankintamenot`,
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
      otherAnnualCapitalGainsOrLosses: 'Muut luovutusvoitot tai tappiot',
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
    warningsTitle: 'Warnings',
    warnings: [
      'This calculator does not support mergers or demergers.',
      'This calculator has not yet been thoroughly tested by humans.',
      'For real monetary advice, use a professional service. This is not one.',
    ],
    securityTitle: 'Security and disclaimer',
    securityText:
      'This application is open source and free to use, but the developer takes no responsibility of any kind for whether the application is secure, error-free, or free to use.',
    securityAdditionalText: 'This application works only in browser. It does not send your data anywhere.',
    securityNote: 'Note: Any data passed in URLs might be visible to others.',
    securityIssues:
      'If you notice bugs or have improvement ideas, create a simple test case and add the finding at https://github.com/mikko-apo/kotibudjetti/issues',
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
      pricePerShare: 'Price / share',
      otherTotalAcquisitionCosts: 'Other acquisition costs total',
      otherTotalAcquisitionCostsHelp:
        'Enter items such as transfer tax, subscription-related fees, and other acquisition costs. Do not include interest on income-producing debt here; report that in annual taxation under deductions from capital income.',
      totalPricePerShare: 'Total acquisition cost / share',
      totalReimbursements: 'Capital repayments total',
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
      shareCount: 'Total shares',
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
    messages: {
      shareCountMismatch: (expected: string, given: string) =>
        `Share count does not match subscriptions on this date. Expected ${expected}, given ${given}.`,
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
        hmo: 'Deemed acquisition cost',
        capitalGain: 'Capital gain',
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
        capitalGain: 'Capital gain from IPO',
        selectedDeductions: 'Deductions reducing capital gain',
        taxOnCapitalGain: 'Reserve for taxes: estimated capital income tax on capital gain',
        deductibleIpoCosts: 'IPO costs inside actual costs',
        hmoIpoCosts: 'IPO costs in HMO lots',
        ipoPriceTotalHelp: (gross: string) => `Total IPO price is the gross price of all sold shares: ${gross}.`,
        ipoCostsAllocatedHelp: (ipoCosts: string) =>
          `Allocated IPO costs ${ipoCosts} are deducted from the share sale price. They may include broker fees and similar costs. For the shares where this calculator uses actual costs, the allocated IPO costs are added to the per-share actual costs.`,
        netCashHelp: (gross: string, ipoCosts: string, net: string) =>
          `Cash before annual taxation = total IPO price ${gross} - allocated IPO costs ${ipoCosts} = ${net}.`,
        capitalGainHelp: (gross: string, acquisitionCosts: string) =>
          `Capital gain is calculated by subtracting "Deductions reducing capital gain" from "Total IPO price": ${gross} - ${acquisitionCosts}.`,
        selectedDeductionsHelp: (actual: string, hmo: string) =>
          `Actual costs ${actual} + deemed acquisition cost ${hmo}.`,
        taxOnCapitalGainHelp: (capitalGain: string, lowPart: string, highPart: string, tax: string) =>
          `In this calculator, capital gain ${capitalGain} is taxable capital income. Estimated 2026 capital income tax is 30% on the first 30,000 euros (${lowPart}) and 34% on the part above that (${highPart}). The estimated capital income tax to reserve is ${tax}.`,
        deductibleIpoCostsHelp: (ipoCosts: string, taxSaved: string) =>
          `Actual-cost lots include IPO costs ${ipoCosts}, reducing estimated tax by ${taxSaved}.`,
        hmoIpoCostsHelp: () => 'In HMO lots, IPO costs cannot be marked as deductions.',
      },
      capitalGainAnnualTax: {
        title: 'Capital gain calculation and annual taxation',
        driversTitle: 'Wins and losses from share sales over the tax year',
        driversValue: '',
        driversHelp:
          'In annual taxation, all capital gains and capital losses are added together at the end, and the resulting amount of "Capital gain" determines the amount of "Capital gain tax". Next, this calculator estimates how much "Capital gain tax" is created if this is the only share sale you make.',
      },
      cashReserve: {
        title: 'Cash you can keep and amount to reserve for taxes',
        otherAnnualCapitalGainsOrLosses: 'Other capital gains or losses',
        otherAnnualCapitalGainsOrLossesHelp: 'Enter any other possible capital gains and losses in this field',
        annualAdjustmentTitle: 'Effect of other capital gains or losses over the tax year',
        annualAdjustedKeepAfterTaxes: 'Can stay in your account over the tax year',
        annualAdjustedReserveForTaxes: 'Reserve for taxes over the tax year',
        keepAfterTaxes: 'Can stay in your account',
        reserveForTaxes: 'Reserve for taxes',
        taxEffectFromOtherAnnualCapital: 'Effect of other annual capital gains or losses on tax',
        taxPaymentStatus: 'Is tax withheld automatically?',
        taxPaymentManual: 'Usually not automatically',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Amount left in your account = cash ${cash} - amount reserved for taxes ${tax} = ${kept}.`,
        reserveForTaxesHelp: (tax: string) =>
          `It is prudent to reserve the estimated tax ${tax} separately so annual taxation does not create an unexpected payment.`,
        taxEffectFromOtherAnnualCapitalHelp: (other: string, reduction: string, increase: string) =>
          `Enter the combined effect of your other annual capital gains or capital losses here. Entered change ${other}. A negative value reduces the tax estimate by ${reduction}. A positive value increases the tax estimate by ${increase}. Selling shares that are down can reduce tax, but an immediate buyback should not be done solely for tax reasons without professional advice.`,
        annualAdjustedKeepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Over the tax year, the amount left in your account = cash ${cash} - tax amount to reserve over the tax year ${tax} = ${kept}.`,
        annualAdjustedReserveForTaxesHelp: (tax: string) =>
          `After other capital gains or losses are included, the tax amount to reserve over the tax year is ${tax}.`,
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
      saveToBrowserStorage: 'Save to browser persistently',
      loadFromBrowserStorage: 'Load from browser',
      removeFromBrowserStorage: 'Remove from browser',
      copyShareUrl: 'Copy company details to URL',
      saveFile: 'Save file',
      loadFile: 'Load file',
      showExample: 'Show example',
      clearExample: 'Clear',
    },
    table: {
      rowTitle: 'Action',
      descriptionTitle: 'Description',
      actionsTitle: 'Buttons',
      autoSaveTitle: 'Auto-save',
      autoSaveDescription:
        'The application saves inputs automatically to window-level storage, so refreshing the page keeps the data available. If the browser window is closed, this data is lost.',
      fileTitle: 'Save file to computer',
      fileDescription: 'You can download the entered data to your computer as a JSON file.',
      browserTitle: 'Save file to browser',
      browserDescription:
        'You can save the data to browser storage. The data becomes automatically available if the page is loaded in a new browser window.',
      clearTitle: 'Clear values',
      clearDescription:
        'You can clear the entered values, but this does not remove data saved to the browser or downloaded files.',
      exampleTitle: 'Show example case',
      exampleDescription: 'You can inspect how the application looks with example data.',
    },
    copyShareUrlHelp: 'Use this to share company information and distributions with others.',
    copyShareUrlNote: 'Note: Any data passed in URLs might be visible to others.',
    status: {
      saved: 'Saved automatically',
      browserSaved: 'Saved to persistent browser storage',
      browserLoaded: 'Loaded from persistent browser storage',
      browserRemoved: 'Persistent browser storage removed',
      shareUrlCopied: 'URL copied',
      loaded: 'Loaded',
      exampleShown: 'Example shown',
      exampleCleared: 'Example data cleared',
      fileSaved: 'File saved',
    },
    errors: {
      invalidFile: 'Invalid file',
      fileReadFailed: 'File read failed',
      clipboardFailed: 'Copy failed',
    },
    confirmations: {
      clearExample: 'Clear all current data?',
    },
    saveIndicators: {
      browserNeedsSave: 'Inputs have changed and are not saved to persistent browser storage.',
      browserSaved: 'Persistent browser storage is up to date.',
      browserLoadUnavailable: 'There is no persistent browser data available to load.',
      fileNeedsSave: 'Inputs have changed and are not saved to a file in this window.',
      fileSaved: 'File save is up to date in this window.',
    },
  },
  messages: {
    errorsTitle: 'There are issues in the inputs',
    warningsTitle: 'Warnings',
  },
  sources: {
    dividends: 'Tax Admin: Dividends from an unlisted company',
    listedDividends: 'Tax Admin: Dividends from a listed company',
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
      subscriptionPricePerShare: (label: string) => `Subscription ${label} price/share`,
      subscriptionOtherTotalAcquisitionCosts: (label: string) => `Subscription ${label} other acquisition costs`,
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
      otherAnnualCapitalGainsOrLosses: 'Other capital gains or losses',
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
