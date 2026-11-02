import {draftMode} from 'next/headers'
import {redirect} from 'next/navigation'

/**
 * Turns Draft Mode off so a previewing editor returns to the published,
 * cached storefront view. Called from the DisableDraftMode banner that only
 * appears while previewing.
 */
export async function GET() {
  ;(await draftMode()).disable()
  return redirect('/')
}
