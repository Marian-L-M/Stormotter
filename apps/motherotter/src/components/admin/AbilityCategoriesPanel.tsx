import { useState } from 'react'
import { useAbilitiesStore } from '../../store/abilitiesStore'

export function AbilityCategoriesPanel() {
  const categories = useAbilitiesStore((state) => state.categories)
  const addCategory = useAbilitiesStore((state) => state.addCategory)
  const updateCategory = useAbilitiesStore((state) => state.updateCategory)
  const removeCategory = useAbilitiesStore((state) => state.removeCategory)
  const [newCategory, setNewCategory] = useState('')

  function handleAddCategory() {
    const id = addCategory(newCategory)
    if (id) setNewCategory('')
  }

  return (
    <details className="admin-attribute-categories-panel">
      <summary>Manage categories ({categories.length})</summary>
      <div className="admin-attribute-categories-body">
        <p className="field-hint">
          Group abilities by category for filtering in this list and in character editors.
        </p>
        {categories.length === 0 ? (
          <p className="admin-empty admin-empty-inline">No categories yet.</p>
        ) : (
          <ul className="admin-attribute-category-list">
            {categories.map((category) => (
              <li key={category.id} className="admin-attribute-category-row">
                <input
                  value={category.name}
                  onChange={(event) => updateCategory(category.id, event.target.value)}
                />
                <button
                  type="button"
                  className="admin-text-button"
                  onClick={() => removeCategory(category.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="admin-taxonomy-add-row">
          <input
            value={newCategory}
            placeholder="New category name…"
            onChange={(event) => setNewCategory(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddCategory()
              }
            }}
          />
          <button type="button" className="admin-secondary-button" onClick={handleAddCategory}>
            Add category
          </button>
        </div>
      </div>
    </details>
  )
}
