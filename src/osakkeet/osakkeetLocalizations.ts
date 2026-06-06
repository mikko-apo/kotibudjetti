export type Language = 'fi' | 'en'

const FI = {
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
    edit: 'Muokkaa',
    done: 'Valmis',
    remove: 'Poista',
  },
  company: {
    title: 'Yrityksen tiedot',
    help: 'Valitse onko yhtiö tällä hetkellä listaamaton vai listattu. Valinnainen listautumispäivä toimii tässä laskurissa IPO-päivänä varojenjaon ja IPO-myynnin rajapäivänä.',
    fields: {
      listingStatus: 'Yhtiön tila',
      becameListedDate: 'Listautumispäivä',
    },
    options: {
      unlisted: 'Listaamaton',
      listed: 'Listattu',
    },
  },
  assumptions: {
    title: 'Laskennan oletukset',
    items: [
      'Myynti kohdistetaan merkintäeriin FIFO-järjestyksessä.',
      'Ennen IPO-päivää tehdyt SVOP-varojenjaot käsitellään pääomanpalautuksena vain siltä osin kuin sama osakas saa takaisin omaa enintään 10 vuotta vanhaa sijoitustaan.',
      'IPO-päivänä tai sen jälkeen tehdyt varojenjaot käsitellään tässä laskurissa kokonaan osinkona.',
      'Listaamattoman yhtiön osingon verolajit lasketaan syötetyn osakkeiden matemaattisen arvon perusteella.',
      'Hankintameno-olettama vertaillaan jokaiselle käytetylle merkintäerälle erikseen.',
      'Vuositason vero-, osinko- ja pääomanpalautuslaskenta on tuettu vuosille 2016 ja sitä uudemmille verovuosille.',
      'Pääomatulovero arvioidaan vain tämän myynnin perusteella vuoden 2026 30 % / 34 % verokannoilla.',
    ],
    sourcesLabel: 'Lähteet: ',
  },
  mainSections: {
    actions: {
      open: 'Avaa osio',
      close: 'Sulje osio',
    },
    units: {
      shares: 'osaketta',
      taxYears: 'verovuotta',
      perShare: '/ osake',
    },
    groups: {
      subscriptionsAndSales: {
        title: '2. Osakemerkinnät ja myynnit',
        summary: 'Sisältää: Osakemerkinnät, Osakkeiden myynnit.',
      },
      distributionsAndCorporateActions: {
        title: '1. Yrityksen tiedot: Varojenjako, jakautuminen ja splitit',
        summary:
          'Sisältää: Yrityksen tila ja listautumispäivä, Osingot ja pääomanpalautukset, Yrityksen jakautuminen hankintamenon mukaan, Osakesplitit.',
      },
      taxReturns: {
        title: '3. Veroilmoitukset',
        summary: 'Sisältää: Veroilmoitukset.',
      },
      ipoCalculator: {
        title: '4. IPO-laskuri',
        summary: 'Sisältää: IPO-tiedot ja arvionti, IPO-myynnin tiedot.',
      },
    },
  },
  subscriptions: {
    title: 'Osakemerkinnät',
    help: 'Syötä kaikki merkintäerät omassa hankintajärjestyksessä. Myynnissä käytetään FIFO-periaatetta, ja IPO-päivän jälkeen päättyvä ansaintajakso estää merkintäerän myynnin.',
    fields: {
      purchaseDate: 'Ostopäivä',
      originalShareCount: 'Osakkeita alunperin',
      remainingShareCountCurrentDate: (date: string) => `Osakkeita jäljellä (${date})`,
      vestingEndsOn: 'Ansaintajakso päättyy',
      vestingEndsOnHelp:
        'Tässä laskurissa ansaintajakso vaikuttaa kahteen asiaan. 1) Jos ansaintajakso päättyy vasta IPO-päivän jälkeen, merkintäerää ei lasketa myytäväksi IPO:ssa. 2) Jos työsuhde tai muu järjestelyn ehto päättyy ennen ansaintajakson loppua, yhtiöllä tai muilla osakkailla voi käytännössä olla oikeus ostaa tai lunastaa osakkeet takaisin. Oikeudellisesti ansaintajakso ei yksin aiheuta tätä: osake on lähtökohtaisesti vapaasti luovutettava, jollei yhtiöjärjestyksessä ole sallittua lunastus- tai suostumuslauseketta tai jollei takaisinostosta ole sovittu erikseen osakassopimuksessa, merkintäehdoissa tai työsuhdepohjaisessa järjestelyssä. Yhtiön omien osakkeiden hankinta tai lunastus edellyttää lisäksi osakeyhtiölain 15 luvun mukaista menettelyä ja jakokelpoisia varoja.',
      pricePerShare: 'Alkuperäinen hinta / osake',
      otherTotalAcquisitionCosts: 'Muut hankintamenot yhteensä',
      otherTotalAcquisitionCostsHelp:
        'Syötä tähän esimerkiksi varainsiirtovero, merkintään liittyvät palkkiot ja muut hankinnasta aiheutuneet kulut. Älä syötä tähän tulonhankkimisvelan korkoja, vaan ilmoita ne vuosiverotuksessa kohdassa pääomatuloista tehtävät vähennykset.',
      totalPricePerShare: 'Kokonaishankintameno / osake',
      totalPricePerShareTooltipBase: (shares: string, pricePerShare: string, otherCosts: string, total: string) =>
        `Alku: (${shares} osaketta x ${pricePerShare}) + ${otherCosts} = ${total}`,
      totalPricePerShareTooltipDemerger: (date: string, before: string, ratio: string, after: string) =>
        `${date}: jakautuminen ${before} x ${ratio} = ${after}`,
      totalPricePerShareTooltipSplit: (date: string, beforeShares: string, multiplier: string, afterShares: string) =>
        `${date}: split ${beforeShares} osaketta x ${multiplier} = ${afterShares} osaketta`,
      totalPricePerShareTooltipResult: (total: string, shares: string, perShare: string) =>
        `Lopuksi: ${total} / ${shares} osaketta = ${perShare}`,
      capitalRepaymentPerShareTooltipReasonTooOld: 'merkinnästä on yli 10 vuotta',
      capitalRepaymentPerShareTooltipReasonNoRemainingCost: 'jäljellä oleva hankintameno on 0',
      capitalRepaymentPerShareTooltipReasonRemainingCostLimit:
        'jäljellä oleva hankintameno ei riittänyt koko pääomanpalautukseen',
      capitalRepaymentPerShareTooltipReasonListedDividend:
        'jako on IPO-päivänä tai sen jälkeen ja käsitellään osinkona',
      remainingCostPerShare: 'Jäljellä oleva hankintameno / osake',
      remainingCostPerShareTooltipBase: (totalPrice: string) => `Lähtö: hankintameno yhteensä ${totalPrice}.`,
      remainingCostPerShareTooltipCapitalRepayment: (
        date: string,
        amountPerShare: string,
        shares: string,
        total: string
      ) => `${date}: pääomanpalautus ${amountPerShare} / osake x ${shares} osaketta = ${total}`,
      remainingCostPerShareTooltipResult: (
        totalPrice: string,
        capitalRepayments: string,
        remainingTotal: string,
        shares: string,
        perShare: string
      ) =>
        `Lopuksi: ${totalPrice} - ${capitalRepayments} = ${remainingTotal}. ${remainingTotal} / ${shares} osaketta = ${perShare}.`,
    },
    summary: {
      totalShares: 'Osakkeita yhteensä',
      vestedShares: 'Ansaintajakson päättäneet osakkeet',
      unvestedShares: 'Ansaintajakson piirissä olevat osakkeet',
      vestedSharesAtDate: (date: string) => `Ansaintajakson päättäneet osakkeet (${date})`,
      unvestedSharesAtDate: (date: string) => `Ansaintajakson piirissä olevat osakkeet (${date})`,
    },
    history: {
      show: 'Tapahtumat',
      hide: 'Sulje tapahtumat',
      empty: 'Ei tapahtumia',
      fields: {
        date: 'Päivä',
        event: 'Tapahtuma',
        shareCount: 'Osakkeita',
        shareCost: 'Hankintameno',
        pricePerShare: 'Hankintameno / osake',
        details: 'Vaikutus',
      },
      events: {
        subscription: 'Merkintä',
        split: 'Split',
        demerger: 'Yrityksen jakautuminen',
        sell: 'Myynti',
        capitalRepayment: 'Pääomanpalautus',
      },
      details: {
        subscription: (shares: string, totalPrice: string, pricePerShare: string) =>
          `${shares} osaketta, hankintameno yhteensä ${totalPrice}, ${pricePerShare} / osake`,
        split: (beforeShares: string, multiplier: string, afterShares: string) =>
          `${beforeShares} osaketta x ${multiplier} = ${afterShares} osaketta`,
        demerger: (beforeTotalPrice: string, ratio: string, afterTotalPrice: string) =>
          `${beforeTotalPrice} x ${ratio} = ${afterTotalPrice}`,
        sell: (soldShares: string, sellPrice: string, pricePerShare: string) =>
          `Myyty ${soldShares} osaketta, myyntihinta yhteensä ${sellPrice} (${pricePerShare} / osake). Osakkeiden määrä pieneni, hankintameno / osake pysyi samana.`,
        capitalRepaymentAppliedOnly: (
          inputPerShare: string,
          shares: string,
          appliedPerShare: string,
          appliedTotal: string
        ) => `Pääomanpalautus ${appliedPerShare} / osake * ${shares} osaketta = ${appliedTotal}.`,
        capitalRepaymentAppliedAndDividend: (
          inputPerShare: string,
          shares: string,
          appliedPerShare: string,
          appliedTotal: string,
          dividendPerShare: string,
          dividendTotal: string,
          reason: string
        ) =>
          `Pääomanpalautus ${inputPerShare} / osake. ${reason}. Pääomanpalautuksena ${appliedPerShare} / osake = ${appliedTotal}. Osinkona ${dividendPerShare} / osake = ${dividendTotal}.`,
        capitalRepaymentDividendOnly: (
          inputPerShare: string,
          shares: string,
          dividendPerShare: string,
          dividendTotal: string,
          reason: string
        ) =>
          `Pääomanpalautus ${inputPerShare} / osake x ${shares} osaketta. Osinkona ${dividendPerShare} / osake = ${dividendTotal} (${reason}).`,
      },
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
      withholdingHelp:
        'Tämä on laskurin arvioima ennakonpidätys, jonka yhtiö pidättää varojenjaosta verottajalle ennen maksua. IPO-päivänä tai sen jälkeen laskuri käsittelee varojenjaon listatun yhtiön osinkona. Ennen IPO:ta ennakonpidätys lasketaan vain siitä osasta, joka verotetaan osinkona eikä pääomanpalautuksena.',
      cashPaid: 'Maksettu käteisenä',
      cashPaidHelp:
        'Tämä on osakkaalle maksettava nettokäteinen varojenjaosta sen jälkeen, kun ennakko verottajalle on vähennetty. Laskurissa summa lasketaan kaavalla yhteensä minus ennakko verottajalle.',
      capitalRepayment: 'Pääomanpalautus',
      capitalRepaymentHelp:
        'Tätä arvoa käytetään vuositason verolaskennassa erottamaan se osa varojenjaosta, joka käsitellään pääomanpalautuksena eikä osinkona.',
      capitalRepaymentSharesHelp: (shares: string) => `Tämän rivin pääomanpalautus lasketaan ${shares} osakkeelle.`,
      dividend: 'Osinko',
      dividendHelp:
        'Tätä arvoa käytetään vuositason verolaskennassa osingon veronalaisen ja verovapaan osuuden sekä ennakonpidätyksen laskentaan.',
      dividendSharesHelp: (shares: string) => `Tämän rivin osinko lasketaan ${shares} osakkeelle.`,
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
  sells: {
    title: 'Osakkeiden myynnit',
    help: 'Syötä toteutuneet myynnit aikajärjestyksessä. Myynti vähentää myöhempien päivien jäljellä olevia osakkeita ja hankintamenoa FIFO-periaatteella.',
    fields: {
      shareCount: 'Myytyjä osakkeita',
      pricePerShare: 'Myyntihinta / osake',
      otherTotalSellCosts: 'Muut kulut',
    },
    actions: {
      add: 'Lisää myynti',
    },
  },
  shareSplits: {
    title: 'Osakesplitit',
    help: 'Syötä splitin päivä ja kerroin. Kerroin 2 tarkoittaa, että yksi vanha osake muuttuu kahdeksi. Kerroin 0,5 tarkoittaa, että kaksi vanhaa osaketta yhdistyy yhdeksi.',
    fields: {
      multiplier: 'Osakkeita / vanha osake',
      exampleEffect: 'Esimerkki',
      exampleEffectValue: (multiplier: string) => `100 osaketta -> ${multiplier} osaketta`,
    },
    actions: {
      add: 'Lisää split',
    },
  },
  demergers: {
    title: 'Yrityksen jakautuminen hankintamenon mukaan',
    help: 'Syötä jakautumisen päivä ja se desimaaliosuus, joka jää tämän laskurin seuraaman vanhan yhtiön hankintamenoksi. Esimerkiksi 0,72 tarkoittaa, että 72 % hankintamenosta jää vanhalle yhtiölle ja loput siirtyvät uudelle yhtiölle. Käytä yhtiön tai verotusohjeen ilmoittamaa jakosuhdetta: se perustuu yleensä nettovarallisuuksien suhteeseen, mutta jos se poikkeaa olennaisesti osakkeiden käypien arvojen suhteesta, käytetään käypien arvojen suhdetta.',
    fields: {
      oldCompanyRatio: 'Vanhan yhtiön osuus hankintamenosta',
      exampleEffect: 'Esimerkki',
      exampleEffectValue: (ratio: string, oldCompany: string, newCompany: string) =>
        `10,00 € -> vanha yhtiö ${oldCompany}, uusi yhtiö ${newCompany}`,
    },
    actions: {
      add: 'Lisää jakautuminen',
    },
  },
  ipo: {
    title: 'IPO-tiedot ja arvionti',
    sections: {
      currentCompany: 'Listaamattoman yrityksen nykyiset tiedot',
      sharePriceEstimate: 'Osakkeen hinnan arviointi yrityksen hinnan perusteella',
      ipoCostEstimate: 'Ipo-kulu per osake arviointi',
    },
    fields: {
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
        sharesToSellShareOfSellable: (share: string) => `${share} myytävissä IPOssa`,
        ipoPricePerShare: 'IPO-hinta / osake',
        ipoCostPerShare: 'Ipo-kulu per osake',
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
        sellableSharesAtDate: (date: string) => `Myytävissä IPOssa (${date})`,
        unvestedSharesAtDate: (date: string) => `Ei myytävissä IPOssa (${date})`,
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
        otherAnnualCapitalGainsOrLossesHelp:
          'Syötä kenttään muut mahdolliset luovutusvoitot ja tappiot ja niiden yhteisarvo',
        annualAdjustmentTitle: 'Muiden luovutusvoittojen tai -tappioiden vaikutus vuositasolla',
        annualAdjustedKeepAfterTaxes: 'Tilille voi jättää vuositasolla',
        annualAdjustedReserveForTaxes: 'Veroihin varattava vuositasolla',
        keepAfterTaxes: 'Tilille voi jättää',
        remainingShares: 'Myymättä jäävät osakkeet',
        remainingSharesTotalLine: (shares: string, value: string) => `Yhteensä: ${shares} osaketta, arvo ${value}`,
        remainingSharesVestedLine: (shares: string, value: string) =>
          `Myytävissä nyt: ${shares} osaketta, arvo ${value}`,
        remainingSharesUnvestedLine: (shares: string, ipoValue: string, originalAcquisitionCost: string) =>
          `Ansaintajakson piirissä: ${shares} osaketta, arvo IPO-hinnalla ${ipoValue}, alkuperäinen hankintameno ${originalAcquisitionCost}`,
        reserveForTaxes: 'Veroihin varattava',
        taxEffectFromOtherAnnualCapital: 'Muiden luovutusvoittojen tai -tappioiden vaikutus veron määrään',
        taxPaymentStatus: 'Peritäänkö vero automaattisesti?',
        taxPaymentManual: 'Ei yleensä automaattisesti',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Tilille jäävä summa = käteen ${cash} - veroihin varattava osuus ${tax} = ${kept}.`,
        remainingSharesHelp: (shareValue: string, totalValue: string) =>
          `Arvo ${totalValue} on laskettu IPO-hinnalla ${shareValue} / osake.`,
        reserveForTaxesHelp: (tax: string) =>
          `Arvioitu vero ${tax} kannattaa varata erikseen, jotta vuotuinen verotus ei aiheuta yllättävää maksua.`,
        taxEffectFromOtherAnnualCapitalHelp: (other: string, reduction: string, increase: string) =>
          `Syötetty muutos ${other}. Negatiivinen arvo pienentää veroarviota ${reduction}. Positiivinen arvo kasvattaa veroarviota ${increase}. Tappiolla olevien osakkeiden myynti voi pienentää veroa, mutta välitöntä takaisinostoa ei kannata tehdä pelkästään verotussyystä ilman ammattilaisen arviota.`,
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
        value: (original: string, gain: string, percent: string) =>
          `Alkuperäinen hankintameno ${original}, nettotulos ${gain} (${percent}).`,
        help: (original: string, kept: string, gain: string, percent: string) =>
          `Myynnissä käytettyjen merkintäerien alkuperäinen hankintameno on ${original}. Tilille voi jättää ${kept}, joten nettotulos käytettyihin merkintäeriin nähden on ${gain} (${percent}).`,
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
    sections: {
      assets: 'Omaisuus',
      unlisted: 'Listaamaton yhtiö',
      unlistedHelp:
        'Tässä osiossa näkyvät ennen IPO-päivää saadut varojenjaot, jotka tämän laskurin mukaan kuuluvat muun kuin julkisesti noteeratun yhtiön tietoihin. Tarkista, että tiedot näkyvät esitäytetyllä veroilmoituksella. Jos tietoja puuttuu tai ne ovat väärin, korjaa ne OmaVerossa.',
      listed: 'Listattu yhtiö',
      allocationSummary: 'Merkintäerittäin yhteenveto',
      allocationDetails: 'Varojenjako merkintäerittäin',
      ipoSale: 'Luovutusvoitot ja -tappiot',
    },
    actions: {
      showAllocationDetails: 'Näytä pääomapalautukset merkintäerittäin',
      hideAllocationDetails: 'Piilota pääomapalautukset merkintäerittäin',
    },
    fields: {
      sharesHeld: 'Osakkeita vuoden lopussa',
      distributionShares: 'Osakkeita',
      distributionSharesTotal: 'Yhteensä',
      distributionSharesCapitalRepayment: 'Pääomanpalautus',
      distributionSharesDividend: 'Osinko',
      mathematicalShareValuePerShare: 'Matemaattinen arvo / osake',
      shareholderMathematicalValue: 'Osakkaan matemaattinen arvo',
      remainingAcquisitionCost: 'Jäljellä oleva hankintameno',
      taxableCapitalIncome: 'Veronalaista pääomatuloa',
      taxFreeCapitalIncome: 'Verotonta pääomatuloa',
      taxableEarnedDividend: 'Veronalaista ansiotulo-osinkoa',
      taxFreeEarnedDividend: 'Verotonta ansiotulo-osinkoa',
      ipoSaleAllocation: 'IPO-myynnin tiedot',
      acquisitionDate: 'Hankintapäivä',
      sellDate: 'Myyntipäivä',
      soldShares: 'Myytyjä osakkeita',
      grossSale: 'Myyntihinta yhteensä',
      actualDeduction: 'Todelliset kulut',
      hankintamenoOlettaDeduction: 'Hankintameno-olettama',
      selectedMethod: 'Valittu vähennys',
      selectedDeduction: 'Vähennys yhteensä',
      taxableCapitalGainWithLoss: 'Luovutusvoitto tai -tappio',
      selectedMethodActualCosts: 'Todelliset kulut',
      selectedMethodHmo: 'Hankintameno-olettama',
      subscriptionDate: 'Merkintäpäivä',
      allocationDistributionCount: 'Varojenjakoja',
      allocationShares: 'Osakkeita',
      allocationGross: 'Varojenjako yhteensä',
      allocationCapitalRepayment: 'Pääomanpalautus',
      allocationDividend: 'Osinko',
      allocationRemainingCostPerShareAfter: 'Jäljellä / osake jälkeen',
      unlistedCapitalRepaymentHelp:
        'Tämä osa on luovutuksena verotettavaa pääomanpalautusta, ei osinkoa. Tarkista, että se näkyy esitäytetyllä veroilmoituksella pääomanpalautuksena. Jos tieto puuttuu, ilmoita tai korjaa se OmaVerossa arvopaperien luovutuksena.',
      unlistedDividendHelp:
        'Tämä osa ilmoitetaan muun kuin julkisesti noteeratun yhtiön osinkona. Tarkista esitäytetty veroilmoitus. Jos tieto puuttuu, lisää OmaVerossa uusi osinkotulo ja valitse listaamaton yhtiö.',
      listedDividendHelp:
        'Tämä osa ilmoitetaan listatun yhtiön osinkona. Tarkista esitäytetty veroilmoitus. Jos tieto puuttuu, lisää OmaVerossa uusi osinkotulo ja valitse listattu yhtiö.',
    },
  },
  storage: {
    title: 'Tallennus',
    actions: {
      saveToBrowserStorage: 'Tallenna selaimeen pysyvästi',
      loadFromBrowserStorage: 'Lataa selaimesta',
      removeFromBrowserStorage: 'Poista selaimesta',
      copyShareUrl: 'Kopioi yrityksen tiedot URL:iin',
      saveFile: 'Tallenna tiedosto',
      saveCompanyFile: 'Tallenna yrityksen tiedot tiedostoon',
      loadFile: 'Lataa tiedosto',
      showSmallExample: 'Pienomistaja, 2v',
      showMediumExample: 'Medium, 8v',
      showLargeExample: 'Large, 16v',
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
      shareUrlTitle: 'Kopioi yrityksen tiedot urliin',
      exampleTitle: 'Näytä esimerkki-tilanne',
      exampleDescription: 'Voit tutkia miltä sovellus näyttää esimerkkidatalla.',
    },
    copyShareUrlHelp: 'Tällä voi jakaa yhtiön tiedot ja varojenjaot toisille.',
    copyShareUrlNote: 'Huom: URL-osoitteissa välitetyt tiedot voivat näkyä muille.',
    timestamps: {
      companyData: 'Yrityksen tiedot päivitetty',
      userData: 'Käyttäjän tiedot päivitetty',
      unavailable: '-',
    },
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
      shareUrlUnavailable: 'URL-jako ei ole tuettu tässä selaimessa.',
      shareUrlLoadFailed: 'Jaetun URL:n avaus epäonnistui.',
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
    demergerAcquisitionCost: 'Verohallinto: Arvopaperien luovutusten verotus - jakautuminen',
    demergers: 'Verohallinto: Yritysjärjestelyt ja verotus - jakautuminen',
    reporting: 'Verohallinto: Esitäytetty veroilmoitus - näin ilmoitat OmaVerossa tai paperilla',
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
      becameListedDate: 'Listautumispäivä',
      totalShareCount: 'Osakkeiden kokonaismäärä',
      totalIpoCost: 'IPO-kulut yhteensä',
      currentShareValue: 'Nykyinen osakkeen arvo',
      estimatedPreIpoValue: 'Arvioitu pre-IPO-arvo',
      estimatedSecondaryShareSellPercentage: 'Arvioitu secondary-myyntiprosentti',
      ipoSellAmount: 'Myytävien osakkeiden määrä',
      ipoSellPricePerShare: 'IPO-myynnin hinta / osake',
      ipoSellCostPerShare: 'IPO-myynnin kulu / osake',
      otherAnnualCapitalGainsOrLosses: 'Muut luovutusvoitot tai tappiot',
      cashDistributionDate: (id: string) => `Varojenjako ${id} päivä`,
      cashDistributionAmountPerShare: (id: string) => `Varojenjako ${id} €/osake`,
      shareSplitDate: (id: string) => `Split ${id} päivä`,
      shareSplitMultiplier: (id: string) => `Split ${id} kerroin`,
      demergerDate: (id: string) => `Jakautuminen ${id} päivä`,
      demergerOldCompanyRatio: (id: string) => `Jakautuminen ${id} vanhan yhtiön osuus`,
    },
    warnings: {
      totalShareCountBelowSubscriptions:
        'Osakkeiden kokonaismäärä on pienempi kuin syötettyjen merkintöjen yhteismäärä.',
      secondarySellPercentZero: 'Secondary-myyntiprosentti on 0, joten IPO-kulu/osake on jaettu koko osakemäärälle.',
      noSharesHeldForDistribution: (date: string) => `Varojenjaolle ${date} ei löytynyt omistettuja osakkeita.`,
      unsupportedYearRange: (year: number) =>
        `Vuositason vero-, osinko- ja pääomanpalautuslaskenta on tuettu verovuosille 2016 ja sitä uudemmille. Syötteissä on vuosi ${year}.`,
      ipoSellAmountExceedsEstimatedSecondary:
        'Myyntimäärä ylittää arvioidun secondary-myyntimäärän koko yhtiön tasolla.',
      vestingBlockedWithoutIpoDate:
        'Listautumispäivä puuttuu, joten ansaintajakson rajoittamia merkintäeriä ei voitu ottaa mukaan myyntiin.',
    },
    errors: {
      ipoSellPricePerShareRequired: 'IPO-hinta / osake pitää syöttää ennen kuin IPO-myynnin arvot voidaan laskea.',
      ipoSellAmountExceedsSellable: (shares: string) =>
        `Myytävien osakkeiden määrä ylittää listautumispäivänä myytävissä olevien osakkeiden määrän (${shares}).`,
    },
  },
}

const EN: typeof FI = {
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
    edit: 'Edit',
    done: 'Done',
    remove: 'Remove',
  },
  company: {
    title: 'Company details',
    help: 'Choose whether the company is currently unlisted or listed. The optional became-listed date acts as the IPO date cutoff in this calculator for distributions and the IPO sale.',
    fields: {
      listingStatus: 'Company status',
      becameListedDate: 'Became listed date',
    },
    options: {
      unlisted: 'Unlisted',
      listed: 'Listed',
    },
  },
  assumptions: {
    title: 'Calculation assumptions',
    items: [
      'Sales are allocated to subscription lots using FIFO.',
      'Before the IPO date, distributions from invested unrestricted equity are treated as capital repayment only to the extent the same shareholder gets back their own investment made within the last 10 years.',
      'On and after the IPO date, distributions are treated as dividends in this calculator.',
      'Tax categories for dividends from an unlisted company are calculated using the entered mathematical value per share for each year.',
      'The deemed acquisition cost is compared separately for each subscription lot used in the sale.',
      'Year-level tax, dividend, and capital-repayment calculations are supported for tax years 2016 and later.',
      'Capital income tax is estimated only for this sale using the 2026 30% / 34% rates.',
    ],
    sourcesLabel: 'Sources: ',
  },
  mainSections: {
    actions: {
      open: 'Open section',
      close: 'Close section',
    },
    units: {
      shares: 'shares',
      taxYears: 'tax years',
      perShare: '/ share',
    },
    groups: {
      subscriptionsAndSales: {
        title: '2. Share subscriptions and sales',
        summary: 'Includes: Share subscriptions, Share sales.',
      },
      distributionsAndCorporateActions: {
        title: '1. Company details: distributions, demergers, and splits',
        summary:
          'Includes: Company status and became-listed date, Dividends and capital repayments, Company demerger by acquisition-cost allocation, Share splits.',
      },
      taxReturns: {
        title: '3. Tax returns',
        summary: 'Includes: Tax returns.',
      },
      ipoCalculator: {
        title: '4. IPO calculator',
        summary: 'Includes: IPO details and estimation, IPO sell details.',
      },
    },
  },
  subscriptions: {
    title: 'Share subscriptions',
    help: 'Enter all subscription lots in acquisition order. FIFO is used for sales, and a vesting period ending after the IPO date blocks that lot from being sold.',
    fields: {
      purchaseDate: 'Purchase date',
      originalShareCount: 'Shares originally',
      remainingShareCountCurrentDate: (date: string) => `Shares remaining (${date})`,
      vestingEndsOn: 'Vesting ends',
      vestingEndsOnHelp:
        'In this calculator, the vesting period affects two things. 1) If vesting ends only after the IPO date, that lot is not treated as sellable in the IPO. 2) If employment or another plan condition ends before vesting is complete, the company or other shareholders may in practice have a right to buy back or redeem the shares. Legally, vesting alone does not create that result: shares are freely transferable by default unless the articles contain a permitted redemption or consent clause, or unless a separate buyback obligation has been agreed in a shareholders agreement, subscription terms, or an employment-based arrangement. In addition, a company buyback or redemption of its own shares must follow Chapter 15 of the Finnish Companies Act and requires distributable funds.',
      pricePerShare: 'Original price / share',
      otherTotalAcquisitionCosts: 'Other acquisition costs total',
      otherTotalAcquisitionCostsHelp:
        'Enter items such as transfer tax, subscription-related fees, and other acquisition costs. Do not include interest on income-producing debt here; report that in annual taxation under deductions from capital income.',
      totalPricePerShare: 'Total acquisition cost / share',
      totalPricePerShareTooltipBase: (shares: string, pricePerShare: string, otherCosts: string, total: string) =>
        `Start: (${shares} shares x ${pricePerShare}) + ${otherCosts} = ${total}`,
      totalPricePerShareTooltipDemerger: (date: string, before: string, ratio: string, after: string) =>
        `${date}: demerger ${before} x ${ratio} = ${after}`,
      totalPricePerShareTooltipSplit: (date: string, beforeShares: string, multiplier: string, afterShares: string) =>
        `${date}: split ${beforeShares} shares x ${multiplier} = ${afterShares} shares`,
      totalPricePerShareTooltipResult: (total: string, shares: string, perShare: string) =>
        `Final: ${total} / ${shares} shares = ${perShare}`,
      capitalRepaymentPerShareTooltipReasonTooOld: 'more than 10 years since subscription',
      capitalRepaymentPerShareTooltipReasonNoRemainingCost: 'remaining acquisition cost is 0',
      capitalRepaymentPerShareTooltipReasonRemainingCostLimit:
        'remaining acquisition cost did not cover the full capital repayment',
      capitalRepaymentPerShareTooltipReasonListedDividend:
        'distribution is on or after the IPO date and is treated as dividend',
      remainingCostPerShare: 'Remaining acquisition cost / share',
      remainingCostPerShareTooltipBase: (totalPrice: string) => `Start: acquisition cost total ${totalPrice}.`,
      remainingCostPerShareTooltipCapitalRepayment: (
        date: string,
        amountPerShare: string,
        shares: string,
        total: string
      ) => `${date}: capital repayment ${amountPerShare} / share x ${shares} shares = ${total}`,
      remainingCostPerShareTooltipResult: (
        totalPrice: string,
        capitalRepayments: string,
        remainingTotal: string,
        shares: string,
        perShare: string
      ) =>
        `Final: ${totalPrice} - ${capitalRepayments} = ${remainingTotal}. ${remainingTotal} / ${shares} shares = ${perShare}.`,
    },
    summary: {
      totalShares: 'Total shares',
      vestedShares: 'Vested shares',
      unvestedShares: 'Unvested shares',
      vestedSharesAtDate: (date: string) => `Vested shares (${date})`,
      unvestedSharesAtDate: (date: string) => `Unvested shares (${date})`,
    },
    history: {
      show: 'Events',
      hide: 'Close events',
      empty: 'No events',
      fields: {
        date: 'Date',
        event: 'Event',
        shareCount: 'Shares',
        shareCost: 'Acquisition cost',
        pricePerShare: 'Acquisition cost / share',
        details: 'Effect',
      },
      events: {
        subscription: 'Subscription',
        split: 'Split',
        demerger: 'Demerger',
        sell: 'Sale',
        capitalRepayment: 'Capital repayment',
      },
      details: {
        subscription: (shares: string, totalPrice: string, pricePerShare: string) =>
          `${shares} shares, acquisition cost total ${totalPrice}, ${pricePerShare} / share`,
        split: (beforeShares: string, multiplier: string, afterShares: string) =>
          `${beforeShares} shares x ${multiplier} = ${afterShares} shares`,
        demerger: (beforeTotalPrice: string, ratio: string, afterTotalPrice: string) =>
          `${beforeTotalPrice} x ${ratio} = ${afterTotalPrice}`,
        sell: (soldShares: string, sellPrice: string, pricePerShare: string) =>
          `Sold ${soldShares} shares, sale price total ${sellPrice} (${pricePerShare} / share). Share count decreased, acquisition cost / share stayed the same.`,
        capitalRepaymentAppliedOnly: (
          inputPerShare: string,
          shares: string,
          appliedPerShare: string,
          appliedTotal: string
        ) => `Capital repayment ${appliedPerShare} / share * ${shares} shares = ${appliedTotal}.`,
        capitalRepaymentAppliedAndDividend: (
          inputPerShare: string,
          shares: string,
          appliedPerShare: string,
          appliedTotal: string,
          dividendPerShare: string,
          dividendTotal: string,
          reason: string
        ) =>
          `Capital repayment ${inputPerShare} / share. ${reason}. Capital repayment portion ${appliedPerShare} / share = ${appliedTotal}. Dividend portion ${dividendPerShare} / share = ${dividendTotal}.`,
        capitalRepaymentDividendOnly: (
          inputPerShare: string,
          shares: string,
          dividendPerShare: string,
          dividendTotal: string,
          reason: string
        ) =>
          `Capital repayment ${inputPerShare} / share x ${shares} shares. Dividend ${dividendPerShare} / share = ${dividendTotal} (${reason}).`,
      },
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
      withholdingHelp:
        'This is the calculator’s estimate of withholding that the company remits to the tax authority before payment. On and after the IPO date, the calculator treats the distribution as a listed-company dividend. Before the IPO, withholding is calculated only on the part that is taxed as dividend, not as capital repayment.',
      cashPaid: 'Paid in cash',
      cashPaidHelp:
        'This is the net cash paid to the shareholder after the withholding amount has been deducted. In the calculator, the value is total amount minus withholding to the tax authority.',
      capitalRepayment: 'Capital repayment',
      capitalRepaymentHelp:
        'This value is used in the annual tax calculation to separate the part of the distribution that is treated as capital repayment rather than dividend.',
      capitalRepaymentSharesHelp: (shares: string) =>
        `The capital repayment on this row is calculated using ${shares} shares.`,
      dividend: 'Dividend',
      dividendHelp:
        'This value is used in the annual tax calculation to determine the taxable and tax-free dividend portions and the withholding amount.',
      dividendSharesHelp: (shares: string) => `The dividend on this row is calculated using ${shares} shares.`,
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
  sells: {
    title: 'Share sales',
    help: 'Enter completed sales in chronological order. A sale reduces remaining shares and acquisition cost on later dates using FIFO.',
    fields: {
      shareCount: 'Shares sold',
      pricePerShare: 'Sale price / share',
      otherTotalSellCosts: 'Other costs',
    },
    actions: {
      add: 'Add sale',
    },
  },
  shareSplits: {
    title: 'Share splits',
    help: 'Enter the split date and multiplier. A multiplier of 2 means one old share becomes two. A multiplier of 0.5 means two old shares are combined into one.',
    fields: {
      multiplier: 'Shares / old share',
      exampleEffect: 'Example',
      exampleEffectValue: (multiplier: string) => `100 shares -> ${multiplier} shares`,
    },
    actions: {
      add: 'Add split',
    },
  },
  demergers: {
    title: 'Company demerger by acquisition-cost allocation',
    help: 'Enter the demerger date and the decimal portion of acquisition cost that remains with the old company tracked in this calculator. For example, 0.72 means 72% of the acquisition cost remains with the old company and the rest moves to the new company. Use the allocation ratio given by the company or tax guidance: it is usually based on the net-asset ratio, but if that differs materially from the share fair-value ratio, the fair-value ratio is used.',
    fields: {
      oldCompanyRatio: 'Old company share of acquisition cost',
      exampleEffect: 'Example',
      exampleEffectValue: (ratio: string, oldCompany: string, newCompany: string) =>
        `10.00 EUR -> old company ${oldCompany}, new company ${newCompany}`,
    },
    actions: {
      add: 'Add demerger',
    },
  },
  ipo: {
    title: 'IPO details and estimation',
    sections: {
      currentCompany: 'Current details of the unlisted company',
      sharePriceEstimate: 'Share price estimate based on company value',
      ipoCostEstimate: 'IPO cost per share estimate',
    },
    fields: {
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
        sharesToSellShareOfSellable: (share: string) => `${share} sellable at IPO`,
        ipoPricePerShare: 'IPO price / share',
        ipoCostPerShare: 'IPO cost / share',
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
        unvestedShares: 'Not sellable at IPO',
        sellableSharesAtDate: (date: string) => `Sellable at IPO (${date})`,
        unvestedSharesAtDate: (date: string) => `Not sellable at IPO (${date})`,
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
        otherAnnualCapitalGainsOrLossesHelp:
          'Enter any other possible capital gains and losses and their combined amount in this field',
        annualAdjustmentTitle: 'Effect of other capital gains or losses over the tax year',
        annualAdjustedKeepAfterTaxes: 'Can stay in your account over the tax year',
        annualAdjustedReserveForTaxes: 'Reserve for taxes over the tax year',
        keepAfterTaxes: 'Can stay in your account',
        remainingShares: 'Unsold shares',
        remainingSharesTotalLine: (shares: string, value: string) => `Total: ${shares} shares, value ${value}`,
        remainingSharesVestedLine: (shares: string, value: string) => `Vested now: ${shares} shares, value ${value}`,
        remainingSharesUnvestedLine: (shares: string, ipoValue: string, originalAcquisitionCost: string) =>
          `Unvested now: ${shares} shares, value at IPO price ${ipoValue}, original acquisition cost ${originalAcquisitionCost}`,
        reserveForTaxes: 'Reserve for taxes',
        taxEffectFromOtherAnnualCapital: 'Effect of other annual capital gains or losses on tax amount',
        taxPaymentStatus: 'Is tax withheld automatically?',
        taxPaymentManual: 'Usually not automatically',
        keepAfterTaxesHelp: (cash: string, tax: string, kept: string) =>
          `Amount left in your account = cash ${cash} - amount reserved for taxes ${tax} = ${kept}.`,
        remainingSharesHelp: (shareValue: string, totalValue: string) =>
          `Value ${totalValue} is calculated using the IPO price ${shareValue} / share.`,
        reserveForTaxesHelp: (tax: string) =>
          `It is prudent to reserve the estimated tax ${tax} separately so annual taxation does not create an unexpected payment.`,
        taxEffectFromOtherAnnualCapitalHelp: (other: string, reduction: string, increase: string) =>
          `Entered change ${other}. A negative value reduces the tax estimate by ${reduction}. A positive value increases the tax estimate by ${increase}. Selling shares that are down can reduce tax, but an immediate buyback should not be done solely for tax reasons without professional advice.`,
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
        value: (original: string, gain: string, percent: string) =>
          `Original acquisition cost ${original}, net result ${gain} (${percent}).`,
        help: (original: string, kept: string, gain: string, percent: string) =>
          `The original acquisition cost of the subscription lots used in the sale is ${original}. You can keep ${kept}, so the net result against the sold subscription lots is ${gain} (${percent}).`,
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
    sections: {
      assets: 'Assets',
      unlisted: 'Unlisted company',
      unlistedHelp:
        'This section shows pre-IPO distributions that, in this calculator, belong under non-listed company reporting. Check that the data appears on your pre-completed tax return. If information is missing or incorrect, correct it in MyTax.',
      listed: 'Listed company',
      allocationSummary: 'Summary by subscription lot',
      allocationDetails: 'Distribution by subscription lot',
      ipoSale: 'Capital gains and losses',
    },
    actions: {
      showAllocationDetails: 'Show capital repayments by subscription lot',
      hideAllocationDetails: 'Hide capital repayments by subscription lot',
    },
    fields: {
      sharesHeld: 'Shares at year end',
      distributionShares: 'Shares',
      distributionSharesTotal: 'Total',
      distributionSharesCapitalRepayment: 'Capital repayment',
      distributionSharesDividend: 'Dividend',
      mathematicalShareValuePerShare: 'Mathematical value / share',
      shareholderMathematicalValue: 'Shareholder mathematical value',
      remainingAcquisitionCost: 'Remaining acquisition cost',
      taxableCapitalIncome: 'Taxable capital income',
      taxFreeCapitalIncome: 'Tax-free capital income',
      taxableEarnedDividend: 'Taxable earned-income dividend',
      taxFreeEarnedDividend: 'Tax-free earned-income dividend',
      ipoSaleAllocation: 'IPO sale details',
      acquisitionDate: 'Acquisition date',
      sellDate: 'Sale date',
      soldShares: 'Shares sold',
      grossSale: 'Gross sale',
      actualDeduction: 'Actual costs',
      hankintamenoOlettaDeduction: 'Deemed acquisition cost',
      selectedMethod: 'Selected deduction',
      selectedDeduction: 'Deduction total',
      taxableCapitalGainWithLoss: 'Capital gain or loss',
      selectedMethodActualCosts: 'Actual costs',
      selectedMethodHmo: 'Deemed acquisition cost',
      subscriptionDate: 'Subscription date',
      allocationDistributionCount: 'Distributions',
      allocationShares: 'Shares',
      allocationGross: 'Distribution total',
      allocationCapitalRepayment: 'Capital repayment',
      allocationDividend: 'Dividend',
      allocationRemainingCostPerShareAfter: 'Remaining / share after',
      unlistedCapitalRepaymentHelp:
        'This part is a capital repayment taxed as a transfer, not as dividend. Check that it appears on the pre-completed tax return as capital repayment. If it is missing, report or correct it in MyTax as a securities transfer.',
      unlistedDividendHelp:
        'This part is reported as dividend from a non-listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose non-listed company.',
      listedDividendHelp:
        'This part is reported as dividend from a listed company. Check the pre-completed tax return. If it is missing, add a new dividend entry in MyTax and choose listed company.',
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
      saveCompanyFile: 'Save company details to file',
      loadFile: 'Load file',
      showSmallExample: 'Small holder, 2y',
      showMediumExample: 'Medium, 8y',
      showLargeExample: 'Large, 16y',
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
      shareUrlTitle: 'Copy company details to URL',
      exampleTitle: 'Show example case',
      exampleDescription: 'You can inspect how the application looks with example data.',
    },
    copyShareUrlHelp: 'Use this to share company information and distributions with others.',
    copyShareUrlNote: 'Note: Any data passed in URLs might be visible to others.',
    timestamps: {
      companyData: 'Company data updated',
      userData: 'User data updated',
      unavailable: '-',
    },
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
      shareUrlUnavailable: 'URL sharing is not supported in this browser.',
      shareUrlLoadFailed: 'Opening the shared URL failed.',
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
    demergerAcquisitionCost: 'Tax Admin: Taxation of securities transfers - demerger',
    demergers: 'Tax Admin: Corporate reorganisations and taxation - demerger',
    reporting: 'Tax Admin: Pre-completed tax return - how to report in MyTax or on paper',
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
      becameListedDate: 'Became listed date',
      totalShareCount: 'Total share count',
      totalIpoCost: 'Total IPO costs',
      currentShareValue: 'Current share value',
      estimatedPreIpoValue: 'Estimated pre-IPO value',
      estimatedSecondaryShareSellPercentage: 'Estimated secondary sell percentage',
      ipoSellAmount: 'Number of shares to sell',
      ipoSellPricePerShare: 'IPO sell price / share',
      ipoSellCostPerShare: 'IPO sell cost / share',
      otherAnnualCapitalGainsOrLosses: 'Other capital gains or losses',
      cashDistributionDate: (id: string) => `Distribution ${id} date`,
      cashDistributionAmountPerShare: (id: string) => `Distribution ${id} EUR/share`,
      shareSplitDate: (id: string) => `Split ${id} date`,
      shareSplitMultiplier: (id: string) => `Split ${id} multiplier`,
      demergerDate: (id: string) => `Demerger ${id} date`,
      demergerOldCompanyRatio: (id: string) => `Demerger ${id} old-company ratio`,
    },
    warnings: {
      totalShareCountBelowSubscriptions: 'Total share count is lower than the total amount of entered subscriptions.',
      secondarySellPercentZero:
        'Secondary sell percentage is 0, so IPO cost/share has been divided across the full share count.',
      noSharesHeldForDistribution: (date: string) => `No held shares were found for the distribution on ${date}.`,
      unsupportedYearRange: (year: number) =>
        `Year-level tax, dividend, and capital-repayment calculations are supported for tax years 2016 and later. The input contains year ${year}.`,
      ipoSellAmountExceedsEstimatedSecondary:
        'Sell amount exceeds the estimated secondary sell amount at whole-company level.',
      vestingBlockedWithoutIpoDate:
        'The became-listed date is missing, so vesting-restricted subscription lots were excluded from the sale.',
    },
    errors: {
      ipoSellPricePerShareRequired: 'IPO price / share must be entered before the IPO sell values can be calculated.',
      ipoSellAmountExceedsSellable: (shares: string) =>
        `The number of shares to sell exceeds the shares sellable on the became-listed date (${shares}).`,
    },
  },
}

export type OsakkeetLocalization = typeof FI

export function getOsakkeetLocalization(language: Language) {
  return language === 'en' ? EN : FI
}
