import { cloneElement, useId } from 'react'
import type { ReactElement } from 'react'

/** Each native control gets a persistent, uniquely associated visible label. */
export default function AdminField({ label, children, className = '' }: {
  label: string
  children: ReactElement<{ id?: string }>
  className?: string
}) {
  const generatedId = useId()
  const id = children.props.id || generatedId
  return <div className={`admin-field ${className}`}>
    <label htmlFor={id}>{label}</label>
    {cloneElement(children, { id })}
  </div>
}
