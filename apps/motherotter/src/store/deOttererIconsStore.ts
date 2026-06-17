import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createDeOttererIcon,
  type DeOttererIcon,
} from '../admin/deOttererIconTypes'

interface DeOttererIconsState {
  customIcons: DeOttererIcon[]
  setCustomIcons: (icons: DeOttererIcon[]) => void
  addIcon: (label: string) => void
  updateIcon: (
    id: string,
    patch: Partial<
      Pick<DeOttererIcon, 'label' | 'paths' | 'fill' | 'stroke' | 'strokeWidth' | 'viewBox'>
    >,
  ) => void
  removeIcon: (id: string) => void
}

export const useDeOttererIconsStore = create<DeOttererIconsState>()(
  immer((set) => ({
    customIcons: [],

    setCustomIcons: (icons) => {
      set((state) => {
        state.customIcons = icons
      })
    },

    addIcon: (label) => {
      set((state) => {
        state.customIcons.push(createDeOttererIcon(label))
      })
    },

    updateIcon: (id, patch) => {
      set((state) => {
        const icon = state.customIcons.find((entry) => entry.id === id)
        if (!icon) return
        if (patch.label !== undefined) icon.label = patch.label.trim() || icon.label
        if (patch.viewBox !== undefined) icon.viewBox = patch.viewBox
        if (patch.paths !== undefined) icon.paths = patch.paths.filter(Boolean)
        if (patch.fill !== undefined) icon.fill = patch.fill
        if (patch.stroke !== undefined) icon.stroke = patch.stroke
        if (patch.strokeWidth !== undefined) icon.strokeWidth = patch.strokeWidth
      })
    },

    removeIcon: (id) => {
      set((state) => {
        state.customIcons = state.customIcons.filter((entry) => entry.id !== id)
      })
    },
  })),
)
