'use client'

import { useEffect } from 'react'
import { playSfx, type Sfx } from './sfx'

/**
 * One listener for the whole app: any element with data-sfx="coin" (etc.) plays that sound on click,
 * and any .px-btn without one plays a blip. Does nothing while sound is off.
 */
export default function SfxListener() {
    useEffect(() => {
        function onClick(e: MouseEvent) {
            const target = e.target as Element | null
            const tagged = target?.closest<HTMLElement>('[data-sfx]')
            if (tagged) {
                playSfx(tagged.dataset.sfx as Sfx)
                return
            }
            const button = target?.closest<HTMLElement>('.px-btn')
            if (button && !(button as HTMLButtonElement).disabled) playSfx('blip')
        }
        document.addEventListener('click', onClick, true)
        return () => document.removeEventListener('click', onClick, true)
    }, [])

    return null
}
