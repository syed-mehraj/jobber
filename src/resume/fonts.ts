import { EB_Garamond, IBM_Plex_Sans, Inter, Lato, Roboto, Source_Serif_4 } from 'next/font/google'

/*
 * The fonts a resume can use. Each sets a CSS variable named in FONTS (design.ts); put
 * `resumeFontVariables` on a wrapper element and the resume page picks the one it needs.
 * The calls must stay at module scope: next/font reads them at build time.
 */

const inter = Inter({ variable: '--font-resume-inter', subsets: ['latin'], display: 'swap' })

const sourceSerif = Source_Serif_4({ variable: '--font-resume-source-serif', subsets: ['latin'], display: 'swap' })

const lato = Lato({
  variable: '--font-resume-lato',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
})

const roboto = Roboto({
  variable: '--font-resume-roboto',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
})

const ibmPlex = IBM_Plex_Sans({
  variable: '--font-resume-ibm-plex',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const ebGaramond = EB_Garamond({ variable: '--font-resume-eb-garamond', subsets: ['latin'], display: 'swap' })

/** Class names for a wrapper element, so every resume font variable is defined beneath it. */
export const resumeFontVariables: string = [inter, sourceSerif, lato, roboto, ibmPlex, ebGaramond]
  .map((f) => f.variable)
  .join(' ')
