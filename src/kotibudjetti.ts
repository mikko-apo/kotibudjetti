import { setElementToId } from '../../ki-frame/src/domBuilder'
import { kaukolampoExcessPricingCalculator } from './kaukolampo/kaukolampoUi'

console.log('kotibudjetti v0.0.1')

setElementToId('app', kaukolampoExcessPricingCalculator())
