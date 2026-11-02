'use client'

import {useDraftModeEnvironment} from 'next-sanity/hooks'

/**
 * A small "exit preview" control shown only when Draft Mode is active outside
 * the Studio's Presentation iframe (i.e. a person opened the enable link
 * directly). Inside the Presentation Tool the Studio owns navigation, so we
 * hide it to avoid cluttering the editor's view.
 */
export function DisableDraftMode() {
  const environment = useDraftModeEnvironment()
  if (environment === 'live' || environment === 'unknown') return null

  return (
    <a
      href="/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900"
    >
      Exit preview
    </a>
  )
}
