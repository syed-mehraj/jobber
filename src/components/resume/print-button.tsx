'use client'

import { Button } from '@/components/ui/button'

/** Opens the browser's print dialog; choose "Save as PDF" there. The print stylesheet shows only the page. */
export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      Save as PDF
    </Button>
  )
}
