import { createBlankOsakkeetFormData, normalizeLegacyIpoSell, normalizeOsakkeetFormData } from './osakkeetFormData'
import type { OsakkeetFormData } from './osakkeetTypes'

export const storageKeys = {
  language: 'osakkeet-language',
  windowFormData: 'osakkeet-ipo-laskuri-window',
  lastFileSavedHash: 'osakkeet-ipo-laskuri-last-file-hash',
} as const

export const shareUrlQueryKey = 'osakkeet'

export type ShareableOsakkeetUrlData = Pick<
  OsakkeetFormData,
  | 'cashDistributions'
  | 'company'
  | 'shareSplits'
  | 'demergers'
  | 'mathematicalShareValues'
  | 'ipo'
  | 'lastModifiedCompanyData'
  | 'lastModifiedUserData'
>

export type CompanyDataPayload = Omit<ShareableOsakkeetUrlData, 'lastModifiedCompanyData' | 'lastModifiedUserData'>

export type SavedOsakkeetFileData = Omit<OsakkeetFormData, 'ipoSell'> & {
  'ipo-sell'?: OsakkeetFormData['ipoSell']
}

function isCreateId(value: unknown): value is (prefix: string) => string {
  return typeof value === 'function'
}

function requireCreateId(createId?: (prefix: string) => string) {
  if (!isCreateId(createId)) {
    throw new Error('A createId function is required for deserializing osakkeet form data.')
  }
  return createId
}

export function createCompanyDataPayload(data: OsakkeetFormData): CompanyDataPayload {
  return {
    company: data.company,
    cashDistributions: data.cashDistributions.map((cashDistribution) => ({
      id: cashDistribution.id,
      date: cashDistribution.date,
      type: cashDistribution.type,
      amountPerShare: cashDistribution.amountPerShare,
    })),
    shareSplits: data.shareSplits,
    demergers: data.demergers,
    mathematicalShareValues: data.mathematicalShareValues,
    ipo: data.ipo,
  }
}

export function createShareableOsakkeetUrlData(data: OsakkeetFormData): ShareableOsakkeetUrlData {
  return {
    ...createCompanyDataPayload(data),
    lastModifiedCompanyData: data.lastModifiedCompanyData || '',
    lastModifiedUserData: data.lastModifiedUserData || '',
  }
}

function fromShareableOsakkeetUrlData(
  data: Partial<ShareableOsakkeetUrlData>,
  createId: (prefix: string) => string
): OsakkeetFormData {
  const emptyForm = createBlankOsakkeetFormData()
  return normalizeOsakkeetFormData(
    {
      ...emptyForm,
      company: {
        ...emptyForm.company,
        ...(data.company || {}),
      },
      cashDistributions: data.cashDistributions || [],
      shareSplits: data.shareSplits || [],
      demergers: data.demergers || [],
      mathematicalShareValues: data.mathematicalShareValues || [],
      ipo: {
        ...emptyForm.ipo,
        ...(data.ipo || {}),
      },
      subscriptions: emptyForm.subscriptions,
      sells: emptyForm.sells,
      ipoSell: emptyForm.ipoSell,
      lastModifiedCompanyData: data.lastModifiedCompanyData || '',
      lastModifiedUserData: data.lastModifiedUserData || '',
    },
    createId
  )
}

function fromSavedOsakkeetFileData(
  data: Partial<SavedOsakkeetFileData>,
  createId: (prefix: string) => string
): OsakkeetFormData {
  return normalizeOsakkeetFormData(
    normalizeLegacyIpoSell({
      ...data,
      ipoSell: data['ipo-sell'],
    }),
    createId
  )
}

export function createSavedOsakkeetFileData(data: OsakkeetFormData): SavedOsakkeetFileData {
  const { ipoSell, ...rest } = data
  return {
    ...rest,
    'ipo-sell': ipoSell,
  }
}

export function isUrlCompressionSupported() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

function requireUrlCompressionSupport() {
  if (!isUrlCompressionSupported()) {
    throw new Error('URL compression is not supported in this browser.')
  }
}

async function compressUrlBytes(bytes: Uint8Array) {
  requireUrlCompressionSupport()
  const sourceBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(sourceBuffer).set(bytes)
  const sourceStream = new Response(sourceBuffer).body
  if (!sourceStream) throw new Error('Compression source stream is unavailable.')
  const compressedStream = sourceStream.pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(compressedStream).arrayBuffer())
}

async function decompressUrlBytes(bytes: Uint8Array) {
  requireUrlCompressionSupport()
  const sourceBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(sourceBuffer).set(bytes)
  const sourceStream = new Response(sourceBuffer).body
  if (!sourceStream) throw new Error('Decompression source stream is unavailable.')
  const decompressedStream = sourceStream.pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(decompressedStream).arrayBuffer())
}

function encodeBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = normalized.padEnd(normalized.length + paddingLength, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function encodeUrlState(value: ShareableOsakkeetUrlData) {
  const json = JSON.stringify(value)
  const bytes = new TextEncoder().encode(json)
  return encodeBase64Url(await compressUrlBytes(bytes))
}

export async function decodeUrlState(value: string) {
  const bytes = decodeBase64Url(value)
  const decompressed = await decompressUrlBytes(bytes)
  return JSON.parse(new TextDecoder().decode(decompressed)) as Partial<ShareableOsakkeetUrlData>
}

export function serializeOsakkeetFormData(data: OsakkeetFormData, createId: (prefix: string) => string) {
  return JSON.stringify(normalizeOsakkeetFormData(data, createId))
}

export function deserializeOsakkeetFormData(raw: string, createId: (prefix: string) => string) {
  return normalizeOsakkeetFormData(JSON.parse(raw) as Partial<OsakkeetFormData>, createId)
}

export async function buildShareUrl(data: OsakkeetFormData, createId: (prefix: string) => string) {
  const url = new URL(window.location.href)
  url.searchParams.set(
    shareUrlQueryKey,
    await encodeUrlState(createShareableOsakkeetUrlData(normalizeOsakkeetFormData(data, createId)))
  )
  return url.toString()
}

export function deserializeShareableOsakkeetUrlData(
  data: Partial<ShareableOsakkeetUrlData>,
  createId?: (prefix: string) => string
) {
  return fromShareableOsakkeetUrlData(data, requireCreateId(createId))
}

export function deserializeSavedOsakkeetFileData(
  data: Partial<SavedOsakkeetFileData>,
  createId?: (prefix: string) => string
) {
  return fromSavedOsakkeetFileData(data, requireCreateId(createId))
}
