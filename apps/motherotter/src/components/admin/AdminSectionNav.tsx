interface AdminSectionNavProps<T extends string> {
  sections: { id: T; label: string }[]
  active: T
  onChange: (section: T) => void
}

export function AdminSectionNav<T extends string>({
  sections,
  active,
  onChange,
}: AdminSectionNavProps<T>) {
  return (
    <nav className="admin-section-nav" aria-label="Section">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`admin-section-nav-button${active === section.id ? ' is-active' : ''}`}
          aria-current={active === section.id ? 'page' : undefined}
          onClick={() => onChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}
