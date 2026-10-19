import { link, type CardInfo } from './projects'

/** A mobile app: a phone with the app on screen, which zooms into a screen recording when opened. */
export type App = CardInfo & {
  phone: {
    /** On the phone's screen, and the recording's poster frame. Paths are inside /public. */
    screenshot: string
    /** A vertical screen recording (592 x 1296, the screen's shape). */
    video?: string
    /** Without a recording, the open card cycles through these instead. */
    gallery?: string[]
    /** The phone's body colour, and the text colour on its back. */
    color: string
    ink: string
    /** Small print under the app's name on the back. */
    print: string
  }
}

const file = (path: string) => `${import.meta.env.BASE_URL}apps/${path}`
const repo = (name: string) => `https://github.com/AbinavPallathoor/${name}`

// Shown in this order (not sorted by date).
export const apps: App[] = [
  {
    id: 'focus-launcher',
    title: 'Focus Launcher',
    date: '2026/10',
    summary: 'A black-and-white Android launcher with no icons: a clock, your next event and two dials for your apps.',
    details:
      'A minimalist Android launcher with no icons. The home screen is just a clock, your next event and two ' +
      'dials for the apps you actually use: drag from a dot on the right, rotate to an app and let go. Swipe up ' +
      'and type to search (it opens as soon as only one app matches), or swipe left, right or down for the ' +
      'camera, contacts and notifications. No internet permission, no accounts. Built in Kotlin with Jetpack Compose.',
    links: [
      link('Download the APK', `${repo('Focus-Launcher')}/releases/latest`),
      link('GitHub', repo('Focus-Launcher')),
    ],
    phone: {
      screenshot: file('focus-launcher/screen.jpg'),
      video: file('focus-launcher/recording.mp4'),
      color: '#e9e8e4',
      ink: '#111111',
      print: 'Kotlin · Jetpack Compose',
    },
  },
  {
    id: 'pdf-editor',
    title: 'PDF Editor',
    date: '2026/10',
    summary: 'A minimal, fully offline Android PDF reader and editor for filling, signing and annotating documents.',
    details:
      'A minimal PDF reader and editor for Android that works fully offline. The document fills the screen and ' +
      'tools appear only when you ask for them. It spots empty form fields and printed blanks and offers to fill ' +
      'or sign them, annotates with pen, highlighter, text and reusable signatures, and can reorder, delete and ' +
      'merge pages. Edits stay in a private draft until you save, and saving makes a new file unless you choose ' +
      'to replace the original. No internet permission, accounts, ads or analytics. Built in Kotlin.',
    links: [
      link('Download the APK', `${repo('Android-PDF-Editor')}/releases/latest`),
      link('GitHub', repo('Android-PDF-Editor')),
    ],
    phone: {
      screenshot: file('pdf-editor/screen.jpg'),
      video: file('pdf-editor/recording.mp4'),
      color: '#1c1c1e',
      ink: '#f2f2f2',
      print: 'Kotlin · Offline',
    },
  },
]
