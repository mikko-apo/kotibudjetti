import { createState, type State } from '../../../ki-frame/src'
import { b, button, div, h2, h3, h4, input, li, p, section, span, ul } from '../../../ki-frame/src/domBuilder'
import { events } from '../../../ki-frame/src/domBuilderEvents'
import {
  createSectionController,
  createStorageSource,
  createTextNodesFromState,
  replaceChildrenFromState,
  type TextNodesFromValue,
} from './ki-frame-extensions'
import type { Language, OsakkeetLocalization } from './osakkeetLocalizations'
import { formatLastModifiedTimestamp } from './osakkeetFormat'
import {
  buildFullShareUrl,
  buildMergeShareUrl,
  buildShareUrl,
  createSavedOsakkeetFileData,
  createShareableOsakkeetUrlData,
  deserializeSavedOsakkeetFileData,
  serializeOsakkeetFormData,
  storageKeys,
  type SavedOsakkeetFileData,
} from './osakkeetPersistence'
import { createTaxSummaryContent } from './osakkeetUiSummarySections'
import type { OsakkeetCalculation } from './osakkeetUiCalculator'
import type { OsakkeetFormData } from './osakkeetTypes'
import { createActionButton, infoCard, setButtonAttention, setButtonVariant, withHoverInfo } from './osakkeetUiUtils'
import { copyTextToClipboard, downloadJsonFile } from './browserUtils'
import { assumptionsContent } from './osakkeetUiAssumptions'
import { pageStyles } from './osakkeetUiStyles'
import { createId, createOsakkeetFormData } from './osakkeetUiBootstrap'
import { createExampleOsakkeetFormData } from './osakkeetExamples'
import { normalizeOsakkeetFormData } from './osakkeetFormData'

type LocalizedTextNodes = TextNodesFromValue<OsakkeetLocalization>
type OsakkeetPageReadModel = {
  formData: OsakkeetFormData
  languageSelection: Language
  texts: OsakkeetLocalization
  osakkeetCalculation: OsakkeetCalculation
}

export function createTopSection(
  dataState: State<OsakkeetFormData>,
  pageReadState: State<OsakkeetPageReadModel>,
  languageSelectionState: State<Language>,
  localizedTextNodes: LocalizedTextNodes,
  initialStatus = ''
) {
  const viewState = createState({
    value: {
      status: initialStatus,
    },
  })
  const storageTextNodes = localizedTextNodes.storage
  const introTextNodes = localizedTextNodes.intro
  const languageSwitchTextNodes = localizedTextNodes.languageSwitch
  const statusNode = createTextNodesFromState(viewState, { path: ['status'] })
  let currentTexts = pageReadState.get().texts
  const assumptionsRoot = div()
  const timestampsRoot = div(pageStyles.denseStack)
  replaceChildrenFromState(pageReadState, assumptionsRoot, ({ texts }) => assumptionsContent(texts))
  replaceChildrenFromState(pageReadState, timestampsRoot, ({ formData, texts, languageSelection }) => [
    p(
      { class: 'muted' },
      pageStyles.compactParagraph,
      b(`${texts.storage.timestamps.companyData}: `),
      formatLastModifiedTimestamp(
        formData.lastModifiedCompanyData,
        languageSelection,
        texts.storage.timestamps.unavailable
      )
    ),
    p(
      { class: 'muted' },
      pageStyles.compactParagraph,
      b(`${texts.storage.timestamps.userData}: `),
      formatLastModifiedTimestamp(
        formData.lastModifiedUserData,
        languageSelection,
        texts.storage.timestamps.unavailable
      )
    ),
  ])
  const fiButton = button(
    'FI',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('fi')
      },
    })
  )
  const enButton = button(
    'EN',
    pageStyles.smallButton,
    events({
      click() {
        languageSelectionState.set('en')
      },
    })
  )
  const lastFileSavedHashSource = createStorageSource<string>({
    storage: sessionStorage,
    key: storageKeys.lastFileSavedHash,
    serialize: (value) => value,
    deserialize: (raw) => raw,
  })
  const setStatus = (status: string) => {
    viewState.set((current) => ({ ...current, status }))
  }
  const loadFile = () => {
    fileInput.click()
  }
  const saveFullFile = () => {
    const normalized = normalizeOsakkeetFormData(dataState.get(), createId)
    downloadJsonFile('osakkeet-input-state.json', createSavedOsakkeetFileData(normalized))
    const serialized = serializeOsakkeetFormData(normalized, createId)
    lastFileSavedHashSource.save(serialized)
    setStatus(currentTexts.storage.status.fileSaved)
    refreshStorageButtons()
  }
  const saveCompanyFile = () => {
    downloadJsonFile(
      'osakkeet-company-state.json',
      createShareableOsakkeetUrlData(normalizeOsakkeetFormData(dataState.get(), createId))
    )
    setStatus(currentTexts.storage.status.fileSaved)
  }
  const showExample = (preset: 'small2y' | 'medium8y' | 'large16y') => {
    dataState.set(createExampleOsakkeetFormData(preset, createId))
    setStatus(currentTexts.storage.status.exampleShown)
  }
  const copyCurrentShareUrl = () => {
    void (async () => {
      try {
        const copied = await copyTextToClipboard(await buildShareUrl(dataState.get(), createId))
        setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed)
      } catch {
        setStatus(currentTexts.storage.errors.shareUrlUnavailable)
      }
    })()
  }
  const copyCurrentFullShareUrl = () => {
    void (async () => {
      try {
        const copied = await copyTextToClipboard(await buildFullShareUrl(dataState.get(), createId))
        setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed)
      } catch {
        setStatus(currentTexts.storage.errors.shareUrlUnavailable)
      }
    })()
  }
  const copyCurrentMergeShareUrl = () => {
    void (async () => {
      try {
        const copied = await copyTextToClipboard(await buildMergeShareUrl(dataState.get(), createId))
        setStatus(copied ? currentTexts.storage.status.shareUrlCopied : currentTexts.storage.errors.clipboardFailed)
      } catch {
        setStatus(currentTexts.storage.errors.shareUrlUnavailable)
      }
    })()
  }
  const mergeShareUrlLabelNode = span(
    storageTextNodes.actions.copyMergeShareUrlPrefix,
    b(storageTextNodes.actions.copyMergeShareUrlWord),
    storageTextNodes.actions.copyMergeShareUrlSuffix
  )
  const createExampleButtonConfig = (labelNode: Text, preset: 'small2y' | 'medium8y' | 'large16y') => ({
    labelNode,
    variant: 'secondary' as const,
    action: () => {
      showExample(preset)
    },
  })
  const refreshStorageButtons = () => {
    const currentSerialized = serializeOsakkeetFormData(dataState.get(), createId)
    const lastFileSavedHash = lastFileSavedHashSource.load()
    const fileNeedsSave = lastFileSavedHash !== currentSerialized
    ;[topSaveFileButton, stickySaveFileButton].forEach((saveFileButton) => {
      setButtonAttention(
        saveFileButton,
        pageStyles.smallButton,
        pageStyles.attentionButton,
        pageStyles.disabledButton,
        fileNeedsSave
      )
      saveFileButton.title = fileNeedsSave
        ? currentTexts.storage.saveIndicators.fileNeedsSave
        : currentTexts.storage.saveIndicators.fileSaved
    })
  }
  const fileInput = input(
    { type: 'file', accept: 'application/json,.json', hidden: true },
    events({
      change({ node }) {
        const inputNode = node as HTMLInputElement
        const file = inputNode.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}')) as Partial<SavedOsakkeetFileData>
            const normalized = deserializeSavedOsakkeetFileData(parsed, createId)
            dataState.set(normalized)
            lastFileSavedHashSource.save(serializeOsakkeetFormData(normalized, createId))
            setStatus(currentTexts.storage.status.loaded)
            refreshStorageButtons()
          } catch {
            setStatus(currentTexts.storage.errors.invalidFile)
          }
          inputNode.value = ''
        }
        reader.onerror = () => {
          setStatus(currentTexts.storage.errors.fileReadFailed)
          inputNode.value = ''
        }
        reader.readAsText(file)
      },
    })
  )
  const buttonConfigs = [
    {
      labelNode: storageTextNodes.actions.saveFile,
      variant: 'secondary' as const,
      action: saveFullFile,
    },
    {
      labelNode: storageTextNodes.actions.saveCompanyFile,
      variant: 'secondary' as const,
      action: saveCompanyFile,
    },
    {
      labelNode: storageTextNodes.actions.loadFile,
      variant: 'secondary' as const,
      action: loadFile,
    },
    createExampleButtonConfig(storageTextNodes.actions.showSmallExample, 'small2y'),
    createExampleButtonConfig(storageTextNodes.actions.showMediumExample, 'medium8y'),
    createExampleButtonConfig(storageTextNodes.actions.showLargeExample, 'large16y'),
    {
      labelNode: storageTextNodes.actions.clearExample,
      variant: 'secondary' as const,
      action: () => {
        if (!window.confirm(currentTexts.storage.confirmations.clearExample)) {
          return
        }
        dataState.set(createOsakkeetFormData(false))
        setStatus(currentTexts.storage.status.exampleCleared)
      },
    },
    {
      labelNode: storageTextNodes.actions.copyShareUrl,
      variant: 'secondary' as const,
      action: copyCurrentShareUrl,
    },
    {
      labelNode: storageTextNodes.actions.copyFullShareUrl,
      variant: 'secondary' as const,
      action: copyCurrentFullShareUrl,
    },
    {
      labelNode: mergeShareUrlLabelNode,
      variant: 'secondary' as const,
      action: copyCurrentMergeShareUrl,
    },
  ]
  const [
    topSaveFileButton,
    topSaveCompanyFileButton,
    topLoadFileButton,
    smallExampleButton,
    mediumExampleButton,
    largeExampleButton,
    clearExampleButton,
    copyShareUrlButton,
    copyFullShareUrlButton,
    copyMergeShareUrlButton,
  ] = buttonConfigs.map(({ labelNode, variant, action }) =>
    createActionButton(pageStyles.smallButton, labelNode, variant, action)
  )
  const stickySaveFileButton = createActionButton(
    pageStyles.smallButton,
    storageTextNodes.actions.saveFile,
    'secondary',
    saveFullFile
  )
  const stickyLoadFileButton = createActionButton(
    pageStyles.smallButton,
    storageTextNodes.actions.loadFile,
    'secondary',
    loadFile
  )
  dataState.onValueChange(() => {
    refreshStorageButtons()
  })
  refreshStorageButtons()
  const stickyWarningListRoot = ul(pageStyles.stickyWarningList)
  replaceChildrenFromState(pageReadState, stickyWarningListRoot, ({ texts }) =>
    texts.intro.warnings.map((warning) => li(warning))
  )
  const root = div(
    pageStyles.denseStack,
    div(
      { class: 'osakkeet-sticky-warning no-print' },
      div(
        { class: 'osakkeet-sticky-warning__inner' },
        pageStyles.stickyWarningBox,
        div(
          pageStyles.stickyWarningHeader,
          h3(pageStyles.stickyWarningTitle, introTextNodes.warningsTitle),
          div(pageStyles.stickyWarningActions, stickySaveFileButton, stickyLoadFileButton, clearExampleButton)
        ),
        stickyWarningListRoot
      )
    ),
    section(
      { class: 'card' },
      div(
        { class: 'heading' },
        h2(introTextNodes.title),
        div(
          { class: 'no-print' },
          pageStyles.rowButtons,
          span({ class: 'muted' }, languageSwitchTextNodes.label),
          fiButton,
          enButton
        )
      ),
      p({ class: 'muted' }, introTextNodes.description),
      p({ class: 'muted' }, introTextNodes.unlistedDescription),
      div(
        pageStyles.denseStack,
        h3(introTextNodes.securityTitle),
        p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityText),
        p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityAdditionalText),
        p(pageStyles.redNote, pageStyles.compactParagraph, introTextNodes.securityNote),
        p(pageStyles.compactParagraph, { class: 'muted' }, introTextNodes.securityIssues)
      ),
      assumptionsRoot,
      fileInput,
      div({ class: 'heading' }, h3(storageTextNodes.title), span({ class: 'muted' }, statusNode)),
      div(
        pageStyles.denseStack,
        timestampsRoot,
        div(
          pageStyles.denseStack,
          p(
            { class: 'muted' },
            pageStyles.compactParagraph,
            b(storageTextNodes.table.autoSaveTitle, ': '),
            storageTextNodes.table.autoSaveDescription
          )
        ),
        div(
          pageStyles.denseStack,
          p(
            { class: 'muted' },
            pageStyles.compactParagraph,
            b(storageTextNodes.table.fileTitle, ': '),
            storageTextNodes.table.fileDescription
          ),
          div(
            { class: 'no-print' },
            pageStyles.topAlignedRowButtons,
            topSaveCompanyFileButton,
            copyShareUrlButton,
            copyMergeShareUrlButton,
            copyFullShareUrlButton,
            topLoadFileButton
          )
        ),
        div(
          pageStyles.denseStack,
          h4(storageTextNodes.table.exampleTitle),
          div(
            { class: 'no-print' },
            pageStyles.topAlignedRowButtons,
            smallExampleButton,
            mediumExampleButton,
            largeExampleButton
          )
        )
      )
    )
  )

  return createSectionController(root, ({ languageSelection, texts }: OsakkeetPageReadModel) => {
    currentTexts = texts
    setButtonVariant(fiButton, pageStyles.smallButton, languageSelection === 'fi')
    setButtonVariant(enButton, pageStyles.smallButton, languageSelection === 'en')
    refreshStorageButtons()
  })
}

export function createTaxSummarySection(
  pageReadState: State<OsakkeetPageReadModel>,
  localizedTextNodes: LocalizedTextNodes
) {
  const taxReturnsTextNodes = localizedTextNodes.taxReturns
  const resultsRoot = div(pageStyles.denseStack)
  replaceChildrenFromState(pageReadState, resultsRoot, ({ osakkeetCalculation, texts }) =>
    createTaxSummaryContent(osakkeetCalculation, texts, pageStyles, {
      createActionButton: (labelNode, variant, onClick) =>
        createActionButton(pageStyles.smallButton, labelNode, variant, onClick),
      infoCard: (title, value, help) => infoCard(pageStyles.summaryItem, pageStyles.cardMutedText, title, value, help),
      withHoverInfo: (content, tooltip) =>
        withHoverInfo(pageStyles.hoverInfo, pageStyles.hoverInfoIcon, content, tooltip),
    })
  )
  const root = section({ class: 'card' }, h2(taxReturnsTextNodes.title), resultsRoot)

  return createSectionController(root, () => {})
}
