'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DialogProps {
    title: React.ReactNode
    onClose: () => void
    children: React.ReactNode
    /** Buttons for the footer, right-aligned. */
    actions?: React.ReactNode
    /** Block closing (Escape, backdrop, close button) while work is in flight. */
    locked?: boolean
    size?: 'sm' | 'md' | 'lg'
}

/**
 * The one dialog for the arcade system. Rendered into <body> so no parent can trap it,
 * closes on Escape or a backdrop click, and moves focus into the panel.
 */
export default function Dialog({ title, onClose, children, actions, locked = false, size = 'md' }: DialogProps) {
    const titleId = useId()
    const [mounted, setMounted] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => { setMounted(true) }, [])

    // Move focus into the dialog once, when it opens (not on every render, or typing would lose focus).
    useEffect(() => {
        if (mounted) panelRef.current?.focus()
    }, [mounted])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !locked) onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose, locked])

    if (!mounted) return null

    const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size]

    return createPortal(
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-px-void/75 p-4 font-sans text-fg"
            onClick={() => !locked && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                ref={panelRef}
                onClick={(e) => e.stopPropagation()}
                className={`px-panel flex max-h-[90dvh] w-full ${width} flex-col outline-none`}
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b-4 border-frame px-5 py-4">
                    <h2 id={titleId} className="px-title text-sm leading-relaxed sm:text-base">{title}</h2>
                    <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className="px-btn px-btn-sm px-btn-ghost -mr-1 -mt-1">
                        <X className="size-4" aria-hidden />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
                {actions && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t-4 border-frame px-5 py-4">{actions}</div>}
            </div>
        </div>,
        document.body,
    )
}
