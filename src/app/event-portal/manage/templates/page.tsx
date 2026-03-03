'use client'

import { useMemo, useState, useEffect } from 'react'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/AdminCard'
import {
  AdminCheckbox,
  AdminHelp,
  AdminInput,
  AdminLabel,
  AdminTextarea,
} from '@/components/admin/AdminForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSelectMenu } from '@/components/admin/AdminSelectMenu'
import {
  EVENT_PORTAL_COMPONENT_LIBRARY,
  EVENT_PORTAL_FIELD_TYPES,
  EventPortalFieldType,
} from '@/lib/eventPortal'

interface TemplateField {
  id?: string
  key: string
  label: string
  helperText?: string | null
  placeholder?: string | null
  type: EventPortalFieldType
  required: boolean
  options: string[]
  fieldOrder: number
}

interface TemplateItem {
  id: string
  name: string
  eventTypeId: string
  eventType: string
  description?: string | null
  isDefault: boolean
  isArchived: boolean
  eventsCount: number
  fields: TemplateField[]
}

interface EventTypeItem {
  id: string
  name: string
  slug: string
  isSystem: boolean
  isActive: boolean
  templatesCount: number
  eventsCount: number
}

function formatFieldKey(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || 'new_field'
}

export default function EventPortalTemplatesManagePage() {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [eventTypeId, setEventTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [fields, setFields] = useState<TemplateField[]>([])

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [newEventTypeName, setNewEventTypeName] = useState('')
  const [eventTypeSaveState, setEventTypeSaveState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [eventTypeMessage, setEventTypeMessage] = useState('')

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const [eventTypesResponse, templatesResponse] = await Promise.all([
        fetch('/api/event-portal/event-types?includeInactive=1'),
        fetch('/api/event-portal/templates?includeArchived=1'),
      ])

      if (eventTypesResponse.ok) {
        const eventTypesData = await eventTypesResponse.json()
        const nextEventTypes = Array.isArray(eventTypesData?.eventTypes)
          ? eventTypesData.eventTypes
          : []
        setEventTypes(nextEventTypes)
        setEventTypeId((prev) => prev || nextEventTypes[0]?.id || '')
      }

      if (!templatesResponse.ok) return
      const data = await templatesResponse.json()
      const nextTemplates = Array.isArray(data?.templates) ? data.templates : []
      setTemplates(nextTemplates)

      if (!activeTemplateId && nextTemplates.length > 0) {
        selectTemplate(nextTemplates[0])
      } else if (activeTemplateId) {
        const active = nextTemplates.find((item: TemplateItem) => item.id === activeTemplateId)
        if (!active && nextTemplates.length > 0) {
          selectTemplate(nextTemplates[0])
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeTemplate = useMemo(
    () => templates.find((item) => item.id === activeTemplateId) || null,
    [activeTemplateId, templates]
  )

  const resetBuilder = () => {
    setActiveTemplateId(null)
    setName('')
    setEventTypeId(eventTypes[0]?.id || '')
    setDescription('')
    setIsDefault(false)
    setIsArchived(false)
    setFields([])
    setMessage('')
    setSaveState('idle')
  }

  const selectTemplate = (template: TemplateItem) => {
    setActiveTemplateId(template.id)
    setName(template.name)
    setEventTypeId(template.eventTypeId)
    setDescription(template.description || '')
    setIsDefault(Boolean(template.isDefault))
    setIsArchived(Boolean(template.isArchived))
    setFields(
      [...(template.fields || [])]
        .sort((a, b) => a.fieldOrder - b.fieldOrder)
        .map((field, index) => ({
          ...field,
          fieldOrder: index,
          options: Array.isArray(field.options) ? field.options : [],
        }))
    )
    setMessage('')
    setSaveState('idle')
  }

  const createEventType = async () => {
    const trimmed = newEventTypeName.trim()
    if (!trimmed) return
    setEventTypeSaveState('saving')
    setEventTypeMessage('')
    try {
      const response = await fetch('/api/event-portal/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create event type')
      }
      const data = await response.json()
      const created = data?.eventType as EventTypeItem | undefined
      setNewEventTypeName('')
      setEventTypeSaveState('idle')
      setEventTypeMessage('Event type created.')
      await fetchTemplates()
      if (created?.id) setEventTypeId(created.id)
      window.setTimeout(() => setEventTypeMessage(''), 1500)
    } catch (error) {
      setEventTypeSaveState('error')
      setEventTypeMessage(error instanceof Error ? error.message : 'Failed to create event type')
    }
  }

  const addFieldFromLibrary = (type: EventPortalFieldType) => {
    const item = EVENT_PORTAL_COMPONENT_LIBRARY.find((entry) => entry.type === type)
    if (!item) return
    const baseKey = formatFieldKey(item.defaultLabel)
    const nextKey = fields.some((field) => field.key === baseKey)
      ? `${baseKey}_${fields.length + 1}`
      : baseKey

    setFields((prev) => [
      ...prev,
      {
        key: nextKey,
        label: item.defaultLabel,
        helperText: '',
        placeholder: item.defaultPlaceholder || '',
        type: item.type,
        required: false,
        options: item.defaultOptions || [],
        fieldOrder: prev.length,
      },
    ])
  }

  const updateField = (index: number, updater: Partial<TemplateField>) => {
    setFields((prev) =>
      prev.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...updater, fieldOrder: fieldIndex } : field
      )
    )
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const copy = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= copy.length) return prev
      const current = copy[index]
      copy[index] = copy[target]
      copy[target] = current
      return copy.map((field, fieldIndex) => ({ ...field, fieldOrder: fieldIndex }))
    })
  }

  const removeField = (index: number) => {
    setFields((prev) =>
      prev
        .filter((_, fieldIndex) => fieldIndex !== index)
        .map((field, fieldIndex) => ({ ...field, fieldOrder: fieldIndex }))
    )
  }

  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaveState('saving')
    setMessage('')

    const payload = {
      name,
      eventTypeId,
      description: description || null,
      isDefault,
      isArchived,
      fields: fields.map((field, index) => ({
        key: field.key || formatFieldKey(field.label),
        label: field.label,
        helperText: field.helperText || null,
        placeholder: field.placeholder || null,
        type: field.type,
        required: field.required,
        options: ['select', 'multi_select'].includes(field.type)
          ? field.options
              .map((option) => String(option).trim())
              .filter(Boolean)
          : [],
        fieldOrder: index,
      })),
    }

    try {
      const endpoint = activeTemplateId
        ? `/api/event-portal/templates/${activeTemplateId}`
        : '/api/event-portal/templates'
      const method = activeTemplateId ? 'PATCH' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const details = Array.isArray(data?.details) ? data.details.join('\n') : null
        throw new Error(details || data.error || 'Failed to save template')
      }

      const data = await response.json()
      const savedTemplate = data?.template as TemplateItem | undefined
      setSaveState('success')
      setMessage(activeTemplateId ? 'Template updated.' : 'Template created.')
      await fetchTemplates()
      if (savedTemplate) {
        setActiveTemplateId(savedTemplate.id)
      }
    } catch (error) {
      setSaveState('error')
      setMessage(error instanceof Error ? error.message : 'Failed to save template')
    }
  }

  const deleteTemplate = async (template: TemplateItem) => {
    if (template.eventsCount > 0) {
      window.alert('This template is already in use and cannot be deleted.')
      return
    }
    const ok = window.confirm(`Delete "${template.name}"?`)
    if (!ok) return
    try {
      const response = await fetch(`/api/event-portal/templates/${template.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete template')
      }
      if (template.id === activeTemplateId) {
        resetBuilder()
      }
      await fetchTemplates()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete template')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Template builder"
        description="Build reusable form templates by mixing field components."
        actions={
          <>
            <AdminButton variant="secondary" href="/event-portal/manage">
              Back to events
            </AdminButton>
            <AdminButton variant="secondary" type="button" onClick={resetBuilder}>
              New template
            </AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,_1fr)]">
        <AdminCard>
          <AdminCardHeader className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--admin-fg)]">Templates</h3>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {templates.length} total
              </p>
            </div>
            {loading ? <span className="text-xs text-[var(--admin-muted)]">Loading...</span> : null}
          </AdminCardHeader>
          <AdminCardBody>
            <div className="space-y-3">
              {templates.map((template) => {
                const active = activeTemplateId === template.id
                return (
                  <div
                    key={template.id}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      active
                        ? 'border-[var(--admin-primary)] bg-[var(--admin-surface-2)]'
                        : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-2)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className="block w-full text-left"
                    >
                      <p className="text-sm font-bold text-[var(--admin-fg)]">{template.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{template.eventType}</p>
                      <p className="mt-2 text-xs text-[var(--admin-muted)]">
                        {template.fields.length} field{template.fields.length === 1 ? '' : 's'} ·{' '}
                        {template.eventsCount} event{template.eventsCount === 1 ? '' : 's'}
                      </p>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.isDefault ? (
                        <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-xs font-semibold text-[var(--admin-muted)]">
                          Default
                        </span>
                      ) : null}
                      {template.isArchived ? (
                        <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-xs font-semibold text-[var(--admin-muted)]">
                          Archived
                        </span>
                      ) : null}
                      <AdminButton
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={() => deleteTemplate(template)}
                      >
                        Delete
                      </AdminButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-base font-bold text-[var(--admin-fg)]">
              {activeTemplateId ? 'Edit template' : 'Create template'}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Add components, customize prompts, and save reusable templates for future events.
            </p>
          </AdminCardHeader>
          <AdminCardBody>
            <form onSubmit={saveTemplate} className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <AdminLabel>Template name</AdminLabel>
                  <AdminInput type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <AdminLabel>Event type</AdminLabel>
                    <AdminSelectMenu
                      value={eventTypeId || null}
                      onChange={(nextId) => setEventTypeId(nextId)}
                      options={eventTypes
                        .filter((eventType) => eventType.isActive)
                        .map((eventType) => ({ value: eventType.id, label: eventType.name }))}
                      placeholder="Select an event type"
                      disabled={eventTypes.filter((eventType) => eventType.isActive).length === 0}
                    />

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,_1fr)_auto]">
                    <AdminInput
                      type="text"
                      value={newEventTypeName}
                      onChange={(e) => setNewEventTypeName(e.target.value)}
                      placeholder="Create new event type"
                    />
                    <AdminButton
                      type="button"
                      onClick={createEventType}
                      disabled={eventTypeSaveState === 'saving' || newEventTypeName.trim().length === 0}
                    >
                      {eventTypeSaveState === 'saving' ? 'Adding...' : 'Add'}
                    </AdminButton>
                  </div>

                  {eventTypeMessage ? (
                    <p
                      className={`text-xs ${
                        eventTypeSaveState === 'error'
                          ? 'text-[var(--admin-danger)]'
                          : 'text-[var(--admin-muted)]'
                      }`}
                    >
                      {eventTypeMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <AdminLabel>Template description</AdminLabel>
                <AdminTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-fg)]">
                  <AdminCheckbox checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                  <span>Set as default for this event type</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-fg)]">
                  <AdminCheckbox checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
                  <span>Archive template (hide from active list)</span>
                </label>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--admin-fg)]">Component library</h3>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      Click a component to add it to this template.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {EVENT_PORTAL_COMPONENT_LIBRARY.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addFieldFromLibrary(item.type)}
                      className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-left transition hover:border-[var(--admin-primary)] hover:bg-[var(--admin-surface-2)]"
                    >
                      <p className="text-sm font-bold text-[var(--admin-fg)]">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--admin-fg)]">Template fields</h3>
                {fields.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--admin-muted)]">
                    Add one or more components from the library.
                  </p>
                ) : null}

                <div className="mt-4 space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={`${field.key}-${index}`}
                      className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Label
                          </p>
                          <AdminInput
                            type="text"
                            value={field.label}
                            onChange={(e) => {
                              const nextLabel = e.target.value
                              updateField(index, {
                                label: nextLabel,
                                key: field.key || formatFieldKey(nextLabel),
                              })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Field key
                          </p>
                          <AdminInput
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(index, { key: formatFieldKey(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Type
                          </p>
                            <AdminSelectMenu
                              value={field.type}
                              onChange={(nextType) =>
                                updateField(index, {
                                  type: nextType as EventPortalFieldType,
                                  options:
                                    nextType === 'select' || nextType === 'multi_select'
                                      ? field.options.length > 0
                                        ? field.options
                                        : ['Option 1']
                                      : [],
                                })
                              }
                              options={EVENT_PORTAL_FIELD_TYPES.map((type) => ({
                                value: type,
                                label: type,
                              }))}
                              placeholder="Select field type"
                              searchable={false}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Placeholder
                          </p>
                          <AdminInput
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                          Helper text
                        </p>
                        <AdminInput
                          type="text"
                          value={field.helperText || ''}
                          onChange={(e) => updateField(index, { helperText: e.target.value })}
                        />
                      </div>

                      {field.type === 'select' || field.type === 'multi_select' ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                            Options (comma separated)
                          </p>
                          <AdminInput
                            type="text"
                            value={field.options.join(', ')}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value
                                  .split(',')
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--admin-fg)]">
                          <AdminCheckbox
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="h-3.5 w-3.5"
                          />
                          Required
                        </label>

                        <AdminButton variant="secondary" size="sm" type="button" onClick={() => moveField(index, 'up')}>
                          Move up
                        </AdminButton>
                        <AdminButton variant="secondary" size="sm" type="button" onClick={() => moveField(index, 'down')}>
                          Move down
                        </AdminButton>
                        <AdminButton variant="danger" size="sm" type="button" onClick={() => removeField(index)}>
                          Remove
                        </AdminButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    saveState === 'error'
                      ? 'border-[color-mix(in_oklab,var(--admin-danger)_35%,white)] bg-red-50 text-[var(--admin-danger)]'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {message}
                </div>
              ) : null}

              <AdminButton
                type="submit"
                disabled={saveState === 'saving' || eventTypes.filter((eventType) => eventType.isActive).length === 0}
              >
                {saveState === 'saving'
                  ? 'Saving...'
                  : activeTemplateId
                    ? 'Save template'
                    : 'Create template'}
              </AdminButton>
            </form>
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  )
}

