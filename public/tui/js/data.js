// All site content lives here. Edit this file to update the site.
// Links set to null are hidden until filled in.

window.SITE = {
  name: "Abinav Pallathoor",
  role: "Robotics Engineer",
  banner: [
    " █████╗ ██████╗ ██╗███╗   ██╗ █████╗ ██╗   ██╗",
    "██╔══██╗██╔══██╗██║████╗  ██║██╔══██╗██║   ██║",
    "███████║██████╔╝██║██╔██╗ ██║███████║██║   ██║",
    "██╔══██║██╔══██╗██║██║╚██╗██║██╔══██║╚██╗ ██╔╝",
    "██║  ██║██████╔╝██║██║ ╚████║██║  ██║ ╚████╔╝ ",
    "╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ",
  ],
  photo: "assets/me.jpg",
  tagline: "I build robots from CAD to code.",

  links: {
    email: "abinav.pallathoor@gmail.com",
    linkedin: "https://www.linkedin.com/in/abinav-pallathoor-b65785353/",
    honors: "https://www.linkedin.com/in/abinav-pallathoor-b65785353/details/honors/",
    github: "https://github.com/AbinavPallathoor",
    youtube: "https://www.youtube.com/@Abinav.P",
    portfolioVideo: "https://youtu.be/O13rowx4RRo",
    itch: "https://abinav-pallathoor.itch.io/",
    printables: "https://www.printables.com/@AbinavPallat_1000678",
    cv: "assets/Abinav_Pallathoor_CV.pdf",
  },

  highlights: [
    ["1ST", "Equinox 2026 Hackathon", "RoboVITics × Anchor Panasonic · ₹65K"],
    ["TOP 10", "e-Yantra Robotics Competition '26", "IIT Bombay · of ~1,000 teams"],
    ["1ST", "4x4 in Schools Nationals 2024", "National champions · professional class"],
  ],

  bio: "Robotics engineer and Computer Science undergrad at VIT Vellore, based in Dubai. I build robots end to end: CAD, electronics, firmware and software. Most recently a research intern at e-Yantra, IIT Bombay, working on SLAM and autonomous navigation.",

  about: [
    ["Based", "Dubai, UAE"],
    ["Studying", "B.Tech CS · VIT Vellore · 2025–29"],
    ["Focus", "ROS 2 · Fusion 360 · ESP32/STM32 · Python · C++"],
    ["Status", "Open to work · remote"],
  ],

  work: [
    {
      when: "MAY–JUL 2026",
      start: "2026-05", end: "2026-07",
      short: "e-Yantra",
      related: ["award · Top 10, e-Yantra Robotics Competition '26", "project · CropDrop Bot (eYRC)"],
      logo: "assets/logos/eyantra.png",
      title: "Research Intern",
      org: "e-Yantra, IIT Bombay · eYSIP · Mumbai",
      kind: "work",
      points: [
        "Built 3 omniwheel robots: custom PCBs, RPi 4, RPLIDAR A1, BNO055 IMU.",
        "Fused IMU + odometry with an EKF to fix drift; AMCL localization.",
        "BFS frontier exploration and a DWA local planner for narrow corridors.",
        "Stitched slam_toolbox maps into one global map (phase corr. + ICP).",
      ],
    },
    {
      when: "NOV 2025–MAY 2026",
      start: "2025-11", end: "2026-05",
      short: "Xibotix · PM",
      related: ["project · Gyrosphere", "project · ExoFist"],
      logo: "assets/logos/xibotix.png",
      title: "Senior Product Manager",
      org: "Xibotix Pvt Ltd · Tamil Nadu · Part-time",
      kind: "work",
      points: [
        "Led the team taking rehab devices from prototype to production.",
        "Drove software UX and key decisions on product structure and features.",
      ],
    },
    {
      when: "JUL–NOV 2025",
      start: "2025-07", end: "2025-11",
      short: "Xibotix · SWE",
      related: ["project · Gyrosphere", "project · ExoFist"],
      logo: "assets/logos/xibotix.png",
      title: "Software Intern",
      org: "Xibotix Pvt Ltd · Tamil Nadu · On-site",
      kind: "work",
      points: [
        "Built the Unity3D software and therapy games for Gyrosphere and ExoFist.",
        "ESP32 firmware, hardware integration, SQL metrics and reports.",
        "Designed a dynamic neck-joint mechanism in Fusion 360 for a humanoid.",
      ],
    },
    {
      when: "JUL 2025–AUG 2029",
      start: "2025-07", end: "2029-08",
      short: "VIT",
      related: ["award · 1st, Equinox 2026 Hackathon (RoboVITics)"],
      logo: "assets/logos/vit.png",
      title: "B.Tech, Computer Science",
      org: "Vellore Institute of Technology · Vellore",
      kind: "edu",
      points: [],
    },
    {
      when: "2021–2025",
      start: "2021-01", end: "2025-06",
      short: "GEMS OOHS",
      related: ["award · RoboGenius Award 2025 (7 years of robotics)", "award · 1st, 4x4 in Schools Nationals 2024", "project · PAL, the school receptionist robot"],
      logo: "assets/logos/gems.png",
      title: "High School · Computer Science",
      org: "GEMS Our Own High School · Dubai",
      kind: "edu",
      points: ["Class XII 93.2% [100 in CS] · Class X 97% [100 in Maths]"],
    },
  ],

  // [rank, title, detail, year] — year null = date not on the CV
  awards: [
    ["1ST", "Equinox 2026 Hackathon", "RoboVITics × Anchor Panasonic · ₹65K", 2026],
    ["TOP 10", "e-Yantra Robotics Comp. '26", "IIT Bombay · of ~1,000 teams", 2026],
    ["4TH", "GameDeon GameJam 2025", "Finalist · Techniche, IIT Guwahati", 2025],
    ["AWARD", "RoboGenius Award 2025", "OOHS Dubai · 7 years of robotics", 2025],
    ["1ST", "4x4 in Schools Nationals 2024", "National Champions · Professional class", 2024],
    ["3RD", "GEMS Global Innovation", "GEMS Education · Jan 2024", 2024],
    ["AWARD", "4x4 Innovation Award 2023", "Yas in Schools · Development class", 2023],
    ["1ST", "Inter-School STREAM Challenge", "GEMS Modern Academy · 2022–23", 2023],
    ["1ST", "Novus Senior Innovation 2022", "Smart fridge that suggests recipes", 2022],
    ["4TH", "World Robot Olympiad UAE 2022", "Future Innovators · healthcare robot", 2022],
    ["1ST", "Special Olympics Unified Robotics", "Line follower · inclusive team · 2021", 2021],
    ["4TH", "FIRST LEGO League UAE Finals", "Robot game + innovation project", null],
  ],

  // img: optional photo · glyph: word drawn as ASCII when there is no photo · url: optional link
  projects: [
    { id: "DER-100", img: "assets/projects/der-100.jpg", tag: "CV · IOT", text: "OpenCV crowd detection and a live Unity sim that reroutes people via LED exit signs." },
    { id: "Gyrosphere", img: "assets/projects/gyrosphere.jpg", tag: "REHAB", text: "Wrist-rehab device: built its Unity software, therapy games and SQL reports." },
    { id: "ExoFist", img: "assets/projects/exofist.jpg", tag: "REHAB", text: "India's first hand-rehab device: Unity games, ESP32 integration, SQL reports." },
    { id: "Axis X", img: "assets/projects/axis-x.jpg", tag: "4X4", text: "YAS 4x4 car with self-levelling, dual steering and an app-controlled towbar." },
    { id: "Axis 02", img: "assets/projects/axis-02.jpg", tag: "ROBOTICS", text: "Tower-climbing robot with a camera arm that surveys and makes quick repairs." },
    { id: "PAL", img: "assets/projects/pal.jpg", tag: "ROBOTICS", text: "School receptionist robot that talks and guides visitors around campus." },
    { id: "ESP32 Watch", img: "assets/projects/esp32-watch.jpg", tag: "EMBEDDED", text: "Ultracompact watch from common parts; case, circuit and firmware from scratch." },
    { id: "DUALS", img: "assets/projects/duals.jpg", tag: "GAME", text: "1v1 local split-screen shooter built in Unity, published on Google Play.", url: null },
    { id: "CropDrop Bot", glyph: "CROP", tag: "EYRC", text: "Line-following crate delivery bot (e-Yantra Robotics Competition)." },
    { id: "Stay in the Light", glyph: "LIGHT", tag: "GAME", text: "GameJam finalist game, published on itch.io.", url: "https://abinav-pallathoor.itch.io/stay-in-the-light" },
    { id: "Cable Specimen Rig", glyph: "RIG", tag: "WIP", text: "Dumbbell press, gauge marking." },
    { id: "N20 Docking Bot", glyph: "N20", tag: "WIP", text: "IR-beacon self-docking." },
  ],

  // art: key into Ascii.SKILL_ART · usedIn: only where the CV says so
  skills: [
    { name: "ROS 2", art: "ros", usedIn: ["e-Yantra · SLAM, AMCL, DWA"], sub: "SLAM · Gazebo", group: "SW" },
    { name: "Python", art: "python", usedIn: ["DER-100 · OpenCV"], sub: "OpenCV · Flask", group: "SW" },
    { name: "C / C++", art: "cpp", sub: "Embedded · PID", group: "SW" },
    { name: "Unity 3D", art: "unity", usedIn: ["Gyrosphere", "ExoFist", "DUALS", "DER-100"], sub: "Games · sims", group: "SW" },
    { name: "SQL", art: "sql", usedIn: ["Gyrosphere", "ExoFist", "Xibotix metrics"], sub: "SQLite · MySQL", group: "SW" },
    { name: "Web", art: "web", sub: "React · Svelte", group: "SW" },
    { name: "MCUs", art: "mcu", usedIn: ["ExoFist · ESP32", "ESP32 Watch", "Xibotix firmware"], sub: "ESP32 · STM32", group: "HW" },
    { name: "Electronics", art: "pcb", usedIn: ["e-Yantra · custom PCBs", "ESP32 Watch · circuit"], sub: "PCB · soldering", group: "HW" },
    { name: "Fabrication", art: "fab", usedIn: ["ESP32 Watch · case"], sub: "3D print · metal", group: "HW" },
    { name: "Fusion 360", art: "fusion", usedIn: ["Xibotix · humanoid neck joint"], sub: "CAD · assembly", group: "DS" },
    { name: "Blender", art: "blender", sub: "Model · render", group: "DS" },
    { name: "Cura", art: "cura", sub: "Slicing", group: "DS" },
  ],
};
