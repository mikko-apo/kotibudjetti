import { a, div, h3, li, p, ul } from '../../../ki-frame/src/domBuilder'
import type { OsakkeetLocalization } from './osakkeetLocalizations'
import { pageStyles } from './osakkeetUiStyles'

type SourceKey = keyof OsakkeetLocalization['sources']

const sourceLinkDefinitions: Array<{ key: SourceKey; href: string }> = [
  {
    key: 'dividends',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/osingot-listaamattomasta-yhtiosta/',
  },
  {
    key: 'listedDividends',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osingot/listatusta-yhti%C3%B6st%C3%A4-saadut-osingot/',
  },
  {
    key: 'reporting',
    href: 'https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/veroilmoitus_ja_verotuspaato/ilmoittamisen-ohje/',
  },
  {
    key: 'demergerAcquisitionCost',
    href: 'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48262/arvopaperien-luovutusten-verotus4/',
  },
  {
    key: 'demergers',
    href: 'https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49340/yritysjarjestelyt-ja-verotus-jakautuminen4/',
  },
  {
    key: 'form9a',
    href: 'https://www.vero.fi/tietoa-verohallinnosta/yhteystiedot-ja-asiointi/lomakkeet/tayttoohjeet/9a-arvopapereiden-luovutusvoitot-ja--tappiot-t%C3%A4ytt%C3%B6ohje/',
  },
  {
    key: 'sales',
    href: 'https://www.vero.fi/henkiloasiakkaat/omaisuus/sijoitukset/osakkeiden_myynt/',
  },
]

function linkToSource(textValue: string, href: string) {
  return a(textValue, { href, target: '_blank', rel: 'noreferrer' })
}

export function assumptionsContent(t: OsakkeetLocalization) {
  return div(
    pageStyles.denseStack,
    h3(t.assumptions.title),
    ul(
      pageStyles.listCompact,
      t.assumptions.items.map((item) => li(item))
    ),
    p(
      { class: 'muted' },
      t.assumptions.sourcesLabel,
      ...sourceLinkDefinitions.flatMap((source, index) => [
        ...(index > 0 ? [', '] : []),
        linkToSource(t.sources[source.key], source.href),
      ])
    )
  )
}
