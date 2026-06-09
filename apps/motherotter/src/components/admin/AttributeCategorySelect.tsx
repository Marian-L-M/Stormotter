import { useState } from 'react'
import { UNCATEGORIZED_ATTRIBUTE_CATEGORY } from '../../admin/attributeTypes'
import { useAttributesStore } from '../../store/attributesStore'

interface AttributeCategorySelectProps {
  categoryId: string | null
  onChange: (categoryId: string | null) => void
}

export function AttributeCategorySelect({ categoryId, onChange }: AttributeCategorySelectProps) {
  const categories = useAttributesStore((state) => state.categories)
  const addCategory = useAttributesStore((state) => state.addCategory)
  const [newCategory, setNewCategory] = useState('')

  function handleAddCategory() {
    const id = addCategory(newCategory)
    if (id) {
      onChange(id)
      setNewCategory('')
    }
  }

  return (
    <div className="attribute-category-select">
      <select
        className="admin-select admin-select-block"
        value={categoryId ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{UNCATEGORIZED_ATTRIBUTE_CATEGORY}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="admin-taxonomy-add-row">
        <input
          value={newCategory}
          placeholder="Or create a category…"
          onChange={(event) => setNewCategory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddCategory()
            }
          }}
        />
        <button type="button" className="admin-secondary-button" onClick={handleAddCategory}>
          Add
        </button>
      </div>
    </div>
  )
}
