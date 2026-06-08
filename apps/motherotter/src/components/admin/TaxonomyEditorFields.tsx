import { useState } from 'react'
import type { TaxonomyDomain } from '../../admin/taxonomyTypes'
import { EMPTY_DOMAIN_TAXONOMY, EMPTY_TAXONOMY_ASSIGNMENT } from '../../admin/taxonomyTypes'
import { useTaxonomyStore } from '../../store/taxonomyStore'

interface TaxonomyEditorFieldsProps {
  domain: TaxonomyDomain
  entityId: string
}

export function TaxonomyEditorFields({ domain, entityId }: TaxonomyEditorFieldsProps) {
  const domainTaxonomy = useTaxonomyStore(
    (state) => state.domains[domain] ?? EMPTY_DOMAIN_TAXONOMY,
  )
  const assignment = useTaxonomyStore(
    (state) => state.assignments[entityId] ?? EMPTY_TAXONOMY_ASSIGNMENT,
  )
  const addCategory = useTaxonomyStore((state) => state.addCategory)
  const addTag = useTaxonomyStore((state) => state.addTag)
  const toggleCategory = useTaxonomyStore((state) => state.toggleCategory)
  const toggleTag = useTaxonomyStore((state) => state.toggleTag)
  const removeCategory = useTaxonomyStore((state) => state.removeCategory)
  const removeTag = useTaxonomyStore((state) => state.removeTag)
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  function handleAddCategory() {
    const id = addCategory(domain, newCategory)
    if (id) {
      toggleCategory(domain, entityId, id)
      setNewCategory('')
    }
  }

  function handleAddTag() {
    const id = addTag(domain, newTag)
    if (id) {
      toggleTag(domain, entityId, id)
      setNewTag('')
    }
  }

  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Categories</legend>
        <p className="admin-taxonomy-hint">
          WordPress-style categories for this tab. Create new ones or assign existing.
        </p>
        {domainTaxonomy.categories.length === 0 ? (
          <p className="admin-empty admin-empty-inline">No categories yet.</p>
        ) : (
          <ul className="admin-checkbox-list">
            {domainTaxonomy.categories.map((category) => (
              <li key={category.id}>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={assignment.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(domain, entityId, category.id)}
                  />
                  <span>{category.name}</span>
                </label>
                <button
                  type="button"
                  className="admin-text-button"
                  onClick={() => removeCategory(domain, category.id)}
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
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Tags</legend>
        {assignment.tagIds.length > 0 ? (
          <ul className="admin-tag-list">
            {assignment.tagIds.map((tagId) => {
              const tag = domainTaxonomy.tags.find((entry) => entry.id === tagId)
              if (!tag) return null
              return (
                <li key={tag.id} className="admin-tag-chip">
                  <span>{tag.name}</span>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label={`Remove tag ${tag.name}`}
                    onClick={() => toggleTag(domain, entityId, tag.id)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="admin-empty admin-empty-inline">No tags assigned.</p>
        )}
        {domainTaxonomy.tags.length > 0 ? (
          <details className="admin-taxonomy-details">
            <summary>Add existing tag</summary>
            <ul className="admin-checkbox-list">
              {domainTaxonomy.tags
                .filter((tag) => !assignment.tagIds.includes(tag.id))
                .map((tag) => (
                  <li key={tag.id}>
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTag(domain, entityId, tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                    <button
                      type="button"
                      className="admin-text-button"
                      onClick={() => removeTag(domain, tag.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          </details>
        ) : null}
        <div className="admin-taxonomy-add-row">
          <input
            value={newTag}
            placeholder="New tag name…"
            onChange={(event) => setNewTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddTag()
              }
            }}
          />
          <button type="button" className="admin-secondary-button" onClick={handleAddTag}>
            Add tag
          </button>
        </div>
      </fieldset>
    </>
  )
}
