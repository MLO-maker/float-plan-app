import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPlan } from '../lib/storage.js'
import { getCurrentUser } from '../lib/auth.js'
import { GRACE_MINUTES } from '../lib/alerts.js'
import { formatDateTime, toLocalInputValue } from '../lib/format.js'

const STEPS = ['Vessel', 'Voyage', 'Contacts', 'Review']

const emptyContact = () => ({ name: '', relationship: '', phone: '', email: '' })

// Default the expected return to ~4 hours from now, rounded to the next hour.
function defaultReturn() {
  const d = new Date()
  d.setHours(d.getHours() + 4, 0, 0, 0)
  return toLocalInputValue(d)
}

export default function FilePlan() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [form, setForm] = useState({
    vesselName: '',
    vesselDescription: '',
    captainName: '',
    captainPhone: '',
    souls: '',
    departurePoint: '',
    destination: '',
    departureTime: toLocalInputValue(new Date()),
    expectedReturn: defaultReturn(),
    route: '',
    contacts: [emptyContact()],
  })

  const [errors, setErrors] = useState({})

  const set = (key, value) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setContact = (i, key, value) =>
    setForm((f) => {
      const contacts = f.contacts.map((c, idx) =>
        idx === i ? { ...c, [key]: value } : c,
      )
      return { ...f, contacts }
    })

  const addContact = () =>
    setForm((f) => ({ ...f, contacts: [...f.contacts, emptyContact()] }))

  const removeContact = (i) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.filter((_, idx) => idx !== i),
    }))

  // Per-step validation. Returns an errors object (empty == valid).
  function validateStep(s) {
    const e = {}
    if (s === 0) {
      if (!form.vesselName.trim()) e.vesselName = 'Vessel name is required.'
      if (!form.captainName.trim()) e.captainName = 'Captain name is required.'
    }
    if (s === 1) {
      if (!form.departurePoint.trim())
        e.departurePoint = 'Departure point is required.'
      if (!form.destination.trim())
        e.destination = 'Destination is required.'
      if (!form.expectedReturn)
        e.expectedReturn = 'Expected return time is required.'
      else if (
        form.departureTime &&
        new Date(form.expectedReturn) <= new Date(form.departureTime)
      )
        e.expectedReturn = 'Return must be after departure.'
    }
    if (s === 2) {
      const valid = form.contacts.filter(
        (c) => c.name.trim() && (c.phone.trim() || c.email.trim()),
      )
      if (valid.length === 0)
        e.contacts =
          'Add at least one emergency contact with a name and a phone or email.'
    }
    return e
  }

  function next() {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, 3))
  }

  function back() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  function submit() {
    // Validate all steps before filing.
    for (let s = 0; s <= 2; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length) {
        setErrors(e)
        setStep(s)
        return
      }
    }
    const contacts = form.contacts.filter(
      (c) => c.name.trim() && (c.phone.trim() || c.email.trim()),
    )
    const owner = getCurrentUser()
    const plan = createPlan({
      ownerId: owner?.id,
      ownerName: owner?.name,
      vesselName: form.vesselName.trim(),
      vesselDescription: form.vesselDescription.trim(),
      captainName: form.captainName.trim(),
      captainPhone: form.captainPhone.trim(),
      souls: form.souls ? Number(form.souls) : null,
      departurePoint: form.departurePoint.trim(),
      destination: form.destination.trim(),
      departureTime: new Date(form.departureTime).toISOString(),
      expectedReturn: new Date(form.expectedReturn).toISOString(),
      route: form.route.trim(),
      contacts,
    })
    navigate(`/plan/${plan.id}`)
  }

  const validContacts = useMemo(
    () =>
      form.contacts.filter(
        (c) => c.name.trim() && (c.phone.trim() || c.email.trim()),
      ),
    [form.contacts],
  )

  return (
    <div>
      <div className="page-head">
        <h1>File a Float Plan</h1>
        <p>
          Log your voyage before you leave the dock. If you don&apos;t check in
          by your expected return time, your emergency contacts will be
          alerted automatically.
        </p>
      </div>

      <Stepper step={step} />

      <div className="card">
        {step === 0 && (
          <VesselStep form={form} set={set} errors={errors} />
        )}
        {step === 1 && (
          <VoyageStep form={form} set={set} errors={errors} />
        )}
        {step === 2 && (
          <ContactsStep
            form={form}
            setContact={setContact}
            addContact={addContact}
            removeContact={removeContact}
            errors={errors}
          />
        )}
        {step === 3 && <ReviewStep form={form} contacts={validContacts} />}

        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={back} type="button">
              ← Back
            </button>
          )}
          {step < 3 && (
            <button className="btn btn-primary" onClick={next} type="button">
              Continue →
            </button>
          )}
          {step === 3 && (
            <button
              className="btn btn-primary"
              onClick={submit}
              type="button"
            >
              ⚓ File Float Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'contents' }}>
          <div
            className={
              'step ' +
              (i === step ? 'active' : i < step ? 'done' : '')
            }
          >
            <span className="step-num">{i < step ? '✓' : i + 1}</span>
            <span>{label}</span>
          </div>
          {i < STEPS.length - 1 && <span className="step-sep" />}
        </div>
      ))}
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div className="field">
      <label>
        {label}
        {hint && <span className="hint"> — {hint}</span>}
      </label>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

function VesselStep({ form, set, errors }) {
  return (
    <div>
      <h2 className="step-title">Vessel &amp; Crew</h2>
      <div className="grid-2">
        <Field label="Vessel name" error={errors.vesselName}>
          <input
            value={form.vesselName}
            onChange={(e) => set('vesselName', e.target.value)}
            placeholder="e.g. Sea Sprite"
            className={errors.vesselName ? 'invalid' : ''}
          />
        </Field>
        <Field
          label="Persons on board"
          hint="souls aboard"
        >
          <input
            type="number"
            min="1"
            value={form.souls}
            onChange={(e) => set('souls', e.target.value)}
            placeholder="e.g. 3"
          />
        </Field>
      </div>
      <Field
        label="Vessel description"
        hint="make, length, color, registration"
      >
        <input
          value={form.vesselDescription}
          onChange={(e) => set('vesselDescription', e.target.value)}
          placeholder="e.g. 24ft white Bayliner, reg FL-1234-AB"
        />
      </Field>
      <div className="grid-2">
        <Field label="Captain / skipper name" error={errors.captainName}>
          <input
            value={form.captainName}
            onChange={(e) => set('captainName', e.target.value)}
            placeholder="e.g. James Cook"
            className={errors.captainName ? 'invalid' : ''}
          />
        </Field>
        <Field label="Captain phone" hint="optional">
          <input
            value={form.captainPhone}
            onChange={(e) => set('captainPhone', e.target.value)}
            placeholder="e.g. +1 555 123 4567"
          />
        </Field>
      </div>
    </div>
  )
}

function VoyageStep({ form, set, errors }) {
  return (
    <div>
      <h2 className="step-title">Voyage Details</h2>
      <div className="grid-2">
        <Field label="Departure point" error={errors.departurePoint}>
          <input
            value={form.departurePoint}
            onChange={(e) => set('departurePoint', e.target.value)}
            placeholder="e.g. Marina del Rey, slip 42"
            className={errors.departurePoint ? 'invalid' : ''}
          />
        </Field>
        <Field label="Destination" error={errors.destination}>
          <input
            value={form.destination}
            onChange={(e) => set('destination', e.target.value)}
            placeholder="e.g. Catalina Island — Avalon"
            className={errors.destination ? 'invalid' : ''}
          />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Departure time">
          <input
            type="datetime-local"
            value={form.departureTime}
            onChange={(e) => set('departureTime', e.target.value)}
          />
        </Field>
        <Field
          label="Expected return time"
          hint={`alerts fire ${GRACE_MINUTES} min after this`}
          error={errors.expectedReturn}
        >
          <input
            type="datetime-local"
            value={form.expectedReturn}
            onChange={(e) => set('expectedReturn', e.target.value)}
            className={errors.expectedReturn ? 'invalid' : ''}
          />
        </Field>
      </div>
      <Field
        label="Planned route / waypoints"
        hint="optional but recommended"
      >
        <textarea
          rows={3}
          value={form.route}
          onChange={(e) => set('route', e.target.value)}
          placeholder="e.g. Direct heading 230°, staying inside the shipping lane; fuel stop at Two Harbors."
        />
      </Field>
    </div>
  )
}

function ContactsStep({
  form,
  setContact,
  addContact,
  removeContact,
  errors,
}) {
  return (
    <div>
      <h2 className="step-title">Emergency Contacts</h2>
      <p className="note" style={{ marginTop: 0, marginBottom: '1rem' }}>
        These people will be alerted if the vessel does not check in. Each
        contact needs a name and at least a phone number or email.
      </p>
      {errors.contacts && (
        <p className="error-text" style={{ marginBottom: '1rem' }}>
          {errors.contacts}
        </p>
      )}
      {form.contacts.map((c, i) => (
        <div className="contact-row" key={i}>
          {form.contacts.length > 1 && (
            <button
              type="button"
              className="remove"
              onClick={() => removeContact(i)}
            >
              Remove
            </button>
          )}
          <h4>Contact {i + 1}</h4>
          <div className="grid-2">
            <Field label="Name">
              <input
                value={c.name}
                onChange={(e) => setContact(i, 'name', e.target.value)}
                placeholder="e.g. Sam Reyes"
              />
            </Field>
            <Field label="Relationship" hint="optional">
              <input
                value={c.relationship}
                onChange={(e) =>
                  setContact(i, 'relationship', e.target.value)
                }
                placeholder="e.g. Spouse"
              />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Phone">
              <input
                value={c.phone}
                onChange={(e) => setContact(i, 'phone', e.target.value)}
                placeholder="e.g. +1 555 765 4321"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={c.email}
                onChange={(e) => setContact(i, 'email', e.target.value)}
                placeholder="e.g. sam@example.com"
              />
            </Field>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={addContact}>
        + Add another contact
      </button>
    </div>
  )
}

function ReviewStep({ form, contacts }) {
  return (
    <div>
      <h2 className="step-title">Review &amp; File</h2>
      <div className="summary-grid">
        <Item k="Vessel" v={form.vesselName} />
        <Item k="Captain" v={form.captainName} />
        <Item k="Persons on board" v={form.souls || '—'} />
        <Item k="Vessel description" v={form.vesselDescription || '—'} />
        <Item k="Departure" v={form.departurePoint} />
        <Item k="Destination" v={form.destination} />
        <Item
          k="Departs"
          v={formatDateTime(new Date(form.departureTime).toISOString())}
        />
        <Item
          k="Expected return"
          v={formatDateTime(new Date(form.expectedReturn).toISOString())}
        />
      </div>
      {form.route && (
        <div className="summary-item" style={{ marginTop: '1rem' }}>
          <span className="k">Route</span>
          <span className="v">{form.route}</span>
        </div>
      )}
      <div className="summary-item" style={{ marginTop: '1rem' }}>
        <span className="k">Emergency contacts</span>
        <div className="contact-chips">
          {contacts.map((c, i) => (
            <span className="chip" key={i}>
              {c.name}
              {c.relationship ? ` (${c.relationship})` : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Item({ k, v }) {
  return (
    <div className="summary-item">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  )
}
