import { DEFAULT_EXAMPLE_PRESET, createExampleOsakkeetFormData } from './osakkeetExamples'
import {
  createBlankOsakkeetFormData,
  createEmptyCollectionRow,
} from './osakkeetFormData'
import { storageKeys } from './osakkeetPersistence'
import type { OsakkeetFormData } from './osakkeetTypes'

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createOsakkeetFormData(demo: boolean): OsakkeetFormData {
  if (demo) {
    return createExampleOsakkeetFormData(DEFAULT_EXAMPLE_PRESET, createId)
  }
  return {
    ...createBlankOsakkeetFormData(),
    subscriptions: [createEmptyCollectionRow('subscriptions', createId)],
    sells: [],
    cashDistributions: [createEmptyCollectionRow('cashDistributions', createId)],
  }
}

export function tryLoadLanguage() {
  return localStorage.getItem(storageKeys.language) === 'en' ? 'en' : 'fi'
}
