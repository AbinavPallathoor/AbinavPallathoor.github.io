/** What every card shows, whatever sits in its viewer. */
export type CardInfo = {
  id: string
  title: string
  /** 'YYYY', 'YYYY/MM' or 'YYYY/MM/DD'. Undated projects go last. */
  date?: string
  /** A label like 'Discontinued', shown on the date line. */
  status?: string
  /** Shown on the small card, cut off after 3 lines. */
  summary: string
  /** Longer text shown when the card is open. */
  details: string
  links: { label: string; href: string }[]
}

/** A hardware project: a 3D model on a turntable. */
export type Project = CardInfo & {
  model: {
    /** Path inside /public. */
    url: string
    /** Degrees around x, y, z (y is up, unlike CAD's z-up), for models exported lying on their side. */
    rotation?: [number, number, number]
    /** Size relative to the default fit (1 = fills the viewer). */
    scale?: number
  }
}

export const link = (label: string, href: string) => ({ label, href })
/** A file in /public/docs. */
const doc = (label: string, file: string) => ({ label, href: `${import.meta.env.BASE_URL}docs/${file}` })

// Copy and dates come from the 2025 and 2026 resumes. Order doesn't matter here; see `byDate` below.
const all: Project[] = [
  {
    id: 'eysip-robot',
    title: 'eYSIP Robot',
    date: '2026/05',
    summary: 'Omniwheel robot with LiDAR SLAM, built as a research intern at IIT Bombay.',
    details:
      'Built as a research intern at e-Yantra, IIT Bombay, during the e-Yantra Summer Internship Program (May to July 2026). ' +
      'One of three omniwheel robots with custom PCBs, a Raspberry Pi 4, an RPLIDAR A1 and a BNO055 IMU. ' +
      'IMU and odometry are fused with an EKF to fix drift, with AMCL localization, BFS frontier exploration ' +
      'and a DWA local planner for narrow corridors. Maps from slam_toolbox are stitched into one global map ' +
      'using phase correlation and ICP.',
    model: { url: 'models/eysip-robot.glb' },
    links: [link('Project site', 'https://rancho-bot.carrd.co/')],
  },
  {
    id: 'eyantra-robot',
    title: 'CropDrop Bot',
    date: '2026',
    summary: "Line-following crate delivery bot. Top 10 of ~1,000 teams at eYRC '26.",
    details:
      'A line-following robot that picks up and delivers crates, built for the e-Yantra Robotics Competition 2026 ' +
      '(eYRC) run by IIT Bombay. The team finished in the top 10 out of about 1,000 teams.',
    model: { url: 'models/eyantra-robot.glb', rotation: [0, 180, 0] },
    links: [link('Demo video', 'https://youtu.be/19pxG8b12qk')],
  },
  {
    id: 'axis-x',
    title: 'Axis-X',
    date: '2024',
    summary: '4x4 car with self-levelling, dual steering and an app-controlled towbar.',
    details:
      'Axis-X is a 4x4 car made for the YAS in Schools 4x4 challenge. It has a self-levelling system, dual steering ' +
      'and a moving smart towbar controlled from an app. It won National Champions at the 2024 4x4 in Schools ' +
      'Nationals, and 1st in the development category.',
    model: { url: 'models/axis-x.glb', scale: 1.2 },
    links: [
      doc('Off Centre portfolio 2024 (PDF)', 'off-centre-axis-x-portfolio-2024.pdf'),
      link('Competition day clips', 'https://youtu.be/EjRdqfg0jps'),
    ],
  },
  {
    id: 'axis-02',
    title: 'Axis-02',
    date: '2024/01',
    summary: 'Tower-climbing robot with a camera arm that surveys and makes quick repairs.',
    details:
      'Axis-02 is a telecom tower climbing robot. Its robotic arm carries a camera to survey the tower and make ' +
      'quick repairs. It placed 3rd at the GEMS Global Innovation Challenge in January 2024.',
    model: { url: 'models/axis-02.glb' },
    links: [link('Video', 'https://youtu.be/PcaHRO-PHOw')],
  },
  {
    id: 'axis-01',
    title: 'Axis-01',
    date: '2023',
    summary: 'The first Axis 4x4 car, built for the Yas in Schools challenge.',
    details:
      'The first Axis car, built for the Yas in Schools 4x4 challenge. It won the 4x4 Innovation Award in the ' +
      'development class in 2023.',
    model: { url: 'models/axis-01.glb', rotation: [0, 180, 0] },
    links: [
      doc('Off Centre portfolio 2023 (PDF)', 'off-centre-axis-01-portfolio-2023.pdf'),
      link('Competition day live stream', 'https://youtu.be/WwxlESUxYFE?t=12479'),
    ],
  },
  {
    id: 'pal-robot',
    title: 'PAL',
    date: '2024', // CS project file, academic year 2023–24
    summary: 'School receptionist robot that talks and guides visitors around campus.',
    details:
      'PAL is a receptionist robot made for my school. It can talk to visitors and follow people to guide them ' +
      'around the school.',
    model: { url: 'models/pal-robot.glb', rotation: [-90, 0, 0] },
    links: [doc('PAL Assistant CS project (PDF)', 'pal-assistant-cs-project.pdf')],
  },
  {
    id: 'smart-watch',
    title: 'ESP32 Smartwatch',
    summary: 'Ultracompact watch from common parts; case, circuit and firmware from scratch.',
    details:
      'An ultracompact smartwatch made to be easy to build from readily available parts. Everything was developed ' +
      'from scratch, from the case to the circuit and the software.',
    model: { url: 'models/smart-watch.glb' },
    links: [
      link('Demo video', 'https://youtu.be/02HUC12U0HY'),
      link('github.com/AbinavPallathoor/OLED-Smart-Watch', 'https://github.com/AbinavPallathoor/OLED-Smart-Watch'),
    ],
  },
]

/** Newest first; a bare year sorts after the months of that year. Undated projects go last. */
export function byDate(a: CardInfo, b: CardInfo) {
  if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0
  return b.date.localeCompare(a.date)
}

export const projects = [...all].sort(byDate)
