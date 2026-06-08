interface StringListEditorProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder = 'Describe a distinct feature…',
  addLabel = 'Add feature',
}: StringListEditorProps) {
  function updateItem(index: number, value: string) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, ''])
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>{label}</legend>
      {items.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No features yet.</p>
      ) : (
        <ul className="admin-string-list">
          {items.map((item, index) => (
            <li key={index} className="admin-string-list-row">
              <input
                value={item}
                placeholder={placeholder}
                onChange={(event) => updateItem(index, event.target.value)}
              />
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Remove feature"
                onClick={() => removeItem(index)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="admin-secondary-button" onClick={addItem}>
        {addLabel}
      </button>
    </fieldset>
  )
}
