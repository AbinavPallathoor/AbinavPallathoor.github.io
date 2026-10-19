import { link, type CardInfo } from './projects'

/** A game: a CD jewel case that opens into its trailer, or a slideshow of screenshots if it has none. */
export type Game = CardInfo & {
  case: {
    /** Front cover art, cropped to a square. Paths are inside /public. */
    cover: string
    /** Gameplay shot printed on the back, also the trailer's poster frame. */
    screenshot: string
    /** Plays in the open card. */
    trailer?: string
    /** The trailer is vertical (a phone recording): the open card puts it beside the text, not above. */
    portrait?: boolean
    /** Without a trailer, the open card cycles through these instead. */
    gallery?: string[]
    /** Back cover and spine colour, picked from the cover art, and the text colour on it. */
    color: string
    ink: string
    /** Big line at the top of the back cover. */
    tagline: string
    blurb: string
    features: string[]
    /** Boxed labels in the bottom strip of the back cover (players, platform, ...). */
    badges: string[]
    /** Small print next to the barcode. */
    legal: string
  }
}

const file = (path: string) => `${import.meta.env.BASE_URL}games/${path}`

// Shown in this order (not sorted by date).
export const games: Game[] = [
  {
    id: 'snarp',
    title: 'SNARP',
    status: 'Work in progress',
    summary: 'Snake, but in 3D. You move around a cube instead of a flat board, collecting points as you go.',
    details:
      'Snarp is snake, but in 3D. You move around a cube instead of a flat board, collecting points as you go, ' +
      'with warps and dashes to help you get around quickly.',
    links: [],
    case: {
      cover: file('snarp/cover.jpg'),
      screenshot: file('snarp/screenshot.jpg'),
      trailer: file('snarp/trailer.mp4'),
      portrait: true,
      color: '#1418e0',
      ink: '#ffffff',
      tagline: 'Snake, but on a cube.',
      blurb: 'Wrap around every face of a cube, collecting points as you go. Warp and dash to get where you need to be, fast.',
      features: ['Snake on all six faces of a cube', 'Warps and dashes', 'Chase your fastest 75'],
      badges: ['1 PLAYER', 'MOBILE'],
      legal: '© Abinav Pallathoor. Work in progress.',
    },
  },
  {
    id: 'stay-in-the-light',
    title: 'Stay in the Light',
    date: '2025/09',
    summary: 'Top-down co-op survival horror for two players on one keyboard, made in Unity for two game jams.',
    details:
      'Lost in a forest with only a torch and a friend, two players share one keyboard and have to keep each ' +
      'other in the light while mutated creatures stalk the dark.',
    links: [link('Play on itch.io', 'https://abinav-pallathoor.itch.io/stay-in-the-light')],
    case: {
      cover: file('stay-in-the-light/cover.jpg'),
      screenshot: file('stay-in-the-light/shot-3.jpg'),
      gallery: ['shot-3', 'shot-1', 'shot-2'].map((s) => file(`stay-in-the-light/${s}.jpg`)),
      color: '#8e1014',
      ink: '#f4ece6',
      tagline: 'Two friends. One torch.',
      blurb: 'Lost in the woods at night. Something is out there in the dark. Whatever you do, stay in the light.',
      features: ['2-player co-op on one keyboard', 'Top-down survival horror', 'Made for two game jams'],
      badges: ['2 PLAYERS', 'BROWSER'],
      legal: '© Abinav Pallathoor, Texor, Palkee. Made with Unity.',
    },
  },
  {
    id: 'duals',
    title: 'DUALS',
    status: 'Discontinued',
    summary: '1v1 local split-screen shooter built in Unity, published on Google Play.',
    details:
      'A 1v1 shooter for two players on one phone, with the screen split down the middle. ' +
      'Built in Unity and published on Google Play.',
    links: [],
    case: {
      cover: file('duals/cover.jpg'),
      screenshot: file('duals/screenshot.jpg'),
      trailer: file('duals/trailer.mp4'),
      color: '#ffc000',
      ink: '#141414',
      tagline: 'Two players. One phone.',
      blurb: 'Grab a friend, split the screen and settle it 1v1 on a single phone.',
      features: ['Local split-screen 1v1', 'Built in Unity', 'Out now on Google Play'],
      badges: ['2 PLAYERS', 'ANDROID'],
      legal: '© Abinav Pallathoor. Made with Unity.',
    },
  },
]
