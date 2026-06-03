import { createState } from '../../ki-frame/src'
import { button, div, h1, p, replaceChildren, setElementToId } from '../../ki-frame/src/domBuilder'
import { events } from '../../ki-frame/src/domBuilderEvents'
import { kaukolampoExcessPricingCalculator } from './kaukolampo/kaukolampoUi'
import { osakkeetIpoCalculatorPage } from './osakkeet/osakkeetUi'

console.log('kotibudjetti v0.0.1')

type Route = 'osakkeet' | 'kaukolampo'

function getRoute(): Route {
  return window.location.hash === '#kaukolampo' ? 'kaukolampo' : 'osakkeet'
}

function setRoute(route: Route) {
  window.location.hash = route === 'kaukolampo' ? '#kaukolampo' : '#osakkeet'
}

function navButton(label: string, route: Route, routeState: ReturnType<typeof createState<Route>>) {
  return button(
    label,
    routeState.get() === route && {
      class: 'active',
    },
    events({
      click() {
        setRoute(route)
      },
    })
  )
}

function sidebarNavigation(routeState: ReturnType<typeof createState<Route>>) {
  return div(
    div({ class: 'brand' }, h1('Kotibudjetti'), p('Laskurit')),
    p({ class: 'muted' }, 'Beta'),
    div(
      { class: 'nav' },
      navButton('Osakkeet', 'osakkeet', routeState),
      navButton('Kaukolämpö', 'kaukolampo', routeState)
    )
  )
}

function ensureBottomNav(routeState: ReturnType<typeof createState<Route>>) {
  const existingBottomNav = document.querySelector('.bottom-nav')
  if (existingBottomNav instanceof HTMLElement) return existingBottomNav

  const bottomNav = div({ class: 'bottom-nav no-print' })
  document.body.appendChild(bottomNav)
  replaceChildren(
    bottomNav,
    navButton('Osakkeet', 'osakkeet', routeState),
    navButton('Kaukolämpö', 'kaukolampo', routeState)
  )
  return bottomNav
}

function mountApp() {
  const routeState = createState<Route>({ value: getRoute() })
  const sidebar = document.querySelector('.sidebar')
  const bottomNav = ensureBottomNav(routeState)
  let renderVersion = 0

  window.addEventListener('hashchange', () => {
    routeState.set(getRoute())
  })

  routeState.onValueChange((route) => {
    const currentRenderVersion = ++renderVersion
    if (sidebar instanceof HTMLElement) {
      replaceChildren(sidebar, sidebarNavigation(routeState))
    }
    replaceChildren(
      bottomNav,
      navButton('Osakkeet', 'osakkeet', routeState),
      navButton('Kaukolämpö', 'kaukolampo', routeState)
    )
    if (route === 'kaukolampo') {
      setElementToId('app', kaukolampoExcessPricingCalculator())
      return
    }
    void osakkeetIpoCalculatorPage().then((page) => {
      if (currentRenderVersion !== renderVersion) return
      setElementToId('app', page)
    })
  })
}

mountApp()
