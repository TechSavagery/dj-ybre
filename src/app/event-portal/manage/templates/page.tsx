'use client'

import { useMemo, useState, useEffect } from 'react'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
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
  eventType: string
  description?: string | null
  isDefault: boolean
  isArchived: boolean
  eventsCount: number
  fields: TemplateField[]
}

function formatFieldKey(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || 'new_field'
}

export default function EventPortalTemplatesManagePage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [fields, setFields] = useState<TemplateField[]>([])

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/event-portal/templates?includeArchived=1')
      if (!response.ok) return
      const data = await response.json()
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
    setEventType('')
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
    setEventType(template.eventType)
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
      eventType,
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
    <>
      <PageIntro eyebrow="Event Portal" title="Template builder">
        <p>
          Build reusable form templates by mixing field components for weddings, school dances,
          corporate events, bar gigs, and more.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="mb-10 flex flex-wrap gap-3">
          <Button href="/event-portal/manage">Back to events</Button>
          <Button onClick={resetBuilder}>New template</Button>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_minmax(0,_1fr)]">
          <FadeIn>
            <Border className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-950">Templates</h3>
                {loading ? <span className="text-xs text-neutral-500">Loading...</span> : null}
              </div>
              <div className="mt-4 space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`rounded-xl border p-4 transition ${
                      activeTemplateId === template.id
                        ? 'border-neutral-950 bg-neutral-50'
                        : 'border-neutral-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className="block w-full text-left"
                    >
                      <p className="text-sm font-semibold text-neutral-950">{template.name}</p>
                      <p className="text-xs text-neutral-500">{template.eventType}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {template.fields.length} field
                        {template.fields.length === 1 ? '' : 's'} · {template.eventsCount} event
                        {template.eventsCount === 1 ? '' : 's'}
                      </p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.isDefault ? (
                        <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
                          Default
                        </span>
                      ) : null}
                      {template.isArchived ? (
                        <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
                          Archived
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteTemplate(template)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Border>
          </FadeIn>

          <FadeIn>
            <Border className="p-8">
              <form onSubmit={saveTemplate} className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">
                    {activeTemplateId ? 'Edit template' : 'Create template'}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Add components, customize prompts, and save reusable templates for future events.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Template name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-950">
                      Event type
                    </label>
                    <input
                      type="text"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-950">
                    Template description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                    />
                    <span>Set as default for this event type</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={isArchived}
                      onChange={(e) => setIsArchived(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                    />
                    <span>Archive template (hide from active list)</span>
                  </label>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-950">Component library</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {EVENT_PORTAL_COMPONENT_LIBRARY.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addFieldFromLibrary(item.type)}
                        className="rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-950"
                      >
                        <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                        <p className="mt-1 text-xs text-neutral-600">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-950">Template fields</h3>
                  {fields.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-500">
                      Add one or more components from the library.
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-4">
                    {fields.map((field, index) => (
                      <div key={`${field.key}-${index}`} className="rounded-xl border border-neutral-200 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => {
                                const nextLabel = e.target.value
                                updateField(index, {
                                  label: nextLabel,
                                  key: field.key || formatFieldKey(nextLabel),
                                })
                              }}
                              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Field key
                            </label>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateField(index, { key: formatFieldKey(e.target.value) })}
                              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateField(index, {
                                  type: e.target.value as EventPortalFieldType,
                                  options:
                                    e.target.value === 'select' || e.target.value === 'multi_select'
                                      ? field.options.length > 0
                                        ? field.options
                                        : ['Option 1']
                                      : [],
                                })
                              }
                              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                            >
                              {EVENT_PORTAL_FIELD_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Placeholder
                            </label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Helper text
                          </label>
                          <input
                            type="text"
                            value={field.helperText || ''}
                            onChange={(e) => updateField(index, { helperText: e.target.value })}
                            className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                          />
                        </div>

                        {field.type === 'select' || field.type === 'multi_select' ? (
                          <div className="mt-4 space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Options (comma separated)
                            </label>
                            <input
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
                              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5"
                            />
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                              className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => moveField(index, 'up')}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:text-neutral-950"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 'down')}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:text-neutral-950"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {message ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      saveState === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-green-200 bg-green-50 text-green-700'
                    }`}
                  >
                    {message}
                  </div>
                ) : null}

                <Button type="submit" disabled={saveState === 'saving'}>
                  {saveState === 'saving'
                    ? 'Saving...'
                    : activeTemplateId
                    ? 'Save template'
                    : 'Create template'}
                </Button>
              </form>
            </Border>
          </FadeIn>
        </div>
      </Container>
    </>
  )
}

