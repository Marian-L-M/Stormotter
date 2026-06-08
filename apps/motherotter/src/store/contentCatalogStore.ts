import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { DEFAULT_CHARACTER_CATEGORY } from '../admin/characterTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'
import type { AdminListItem, StubContentType } from '../admin/types'

function createStub(type: StubContentType, index: number): AdminListItem {
  const label = type.charAt(0).toUpperCase() + type.slice(1, -1)
  return {
    id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
    title: `New ${label} ${index}`,
    category: 'Uncategorized',
    updatedAt: new Date().toISOString(),
  }
}

function defaultCharacters(): AdminListItem[] {
  return createDefaultProjectContent().characters.map((character) => ({
    id: character.id,
    title: character.title,
    category: character.characterType,
    updatedAt: character.updatedAt,
  }))
}

type CatalogStubType = Exclude<StubContentType, 'characters'>

interface ContentCatalogState {
  stubs: Record<StubContentType, AdminListItem[]>
  getItems: (type: StubContentType) => AdminListItem[]
  getItem: (type: StubContentType, id: string) => AdminListItem | undefined
  addItem: (type: StubContentType, category?: string) => string
  updateItem: (
    type: StubContentType,
    id: string,
    patch: Partial<Pick<AdminListItem, 'title' | 'category' | 'subtitle'>>,
  ) => void
  removeItem: (type: StubContentType, id: string) => void
  replaceCharacters: (characters: AdminListItem[]) => void
  replaceStubType: (type: CatalogStubType, items: AdminListItem[]) => void
}

export const useContentCatalogStore = create<ContentCatalogState>()(
  immer((set, get) => {
    const defaults = createDefaultProjectContent()
    return {
      stubs: {
        stories: structuredClone(defaults.catalogStubs.stories),
        characters: defaultCharacters(),
        items: structuredClone(defaults.catalogStubs.items),
        containers: structuredClone(defaults.catalogStubs.containers),
        abilities: structuredClone(defaults.catalogStubs.abilities),
        rules: structuredClone(defaults.catalogStubs.rules),
      },

      getItems: (type) => get().stubs[type],

      getItem: (type, id) => get().stubs[type].find((item) => item.id === id),

      addItem: (type, category) => {
        const nextIndex = get().stubs[type].length + 1
        const item = createStub(type, nextIndex)
        if (type === 'characters' && category) {
          item.category = category
        }
        set((state) => {
          state.stubs[type].unshift(item)
        })
        return item.id
      },

      updateItem: (type, id, patch) => {
        set((state) => {
          const item = state.stubs[type].find((entry) => entry.id === id)
          if (!item) return
          if (patch.title !== undefined) item.title = patch.title
          if (patch.category !== undefined) item.category = patch.category
          if (patch.subtitle !== undefined) item.subtitle = patch.subtitle
          item.updatedAt = new Date().toISOString()
        })
      },

      removeItem: (type, id) => {
        set((state) => {
          state.stubs[type] = state.stubs[type].filter((entry) => entry.id !== id)
        })
      },

      replaceCharacters: (characters) => {
        set((state) => {
          state.stubs.characters = structuredClone(characters)
        })
      },

      replaceStubType: (type, items) => {
        set((state) => {
          state.stubs[type] = structuredClone(items)
        })
      },
    }
  }),
)

export function createCharacterStub(characterType: string = DEFAULT_CHARACTER_CATEGORY): AdminListItem {
  const index = 1
  return {
    id: `characters-${crypto.randomUUID().slice(0, 8)}`,
    title: `New Character ${index}`,
    category: characterType,
    updatedAt: new Date().toISOString(),
  }
}
