const fonts = [
    "Courier New",
    "Lucida Console",
    "Roboto Mono",
    "Space Mono",
    "monospace"
  ];
  
  function randomizeText(text) {
    return text
      .split("")
      .map((char) => {
        if (Math.random() < 0.1) return String.fromCharCode(33 + Math.floor(Math.random() * 15));
        if (Math.random() < 0.3) return char.toUpperCase();
        return char;
      })
      .join("");
  }
  
  function applyGlitchEffect(id, originalText) {
    const el = document.getElementById(id);
    let stableText = originalText;
  
    setInterval(() => {
      if (Math.random() < 0.2) {
        el.style.transform = `translate(${Math.random() > 0.5 ? "-5px" : "5px"}, 0)`;
      } else {
        el.style.transform = "translate(0, 0)";
      }
  
      const font = fonts[Math.floor(Math.random() * fonts.length)];
      el.style.fontFamily = font;
  
      if (Math.random() < 0.3) {
        el.innerText = randomizeText(stableText);
      } else {
        el.innerText = stableText;
      }
    }, 300);
  }
  
  applyGlitchEffect("glitch-name", "Abinav");
  applyGlitchEffect("glitch-surname", "Pallathoor");
  
  const profilePic = document.getElementById("profile-pic");
  const imagePool = ["profile1.jpg", "profile2.jpg", "profile3.jpg"];
  let interval;
  
  profilePic.addEventListener("mouseover", () => {
    interval = setInterval(() => {
      const rand = Math.floor(Math.random() * imagePool.length);
      profilePic.src = `profile_pics/${imagePool[rand]}`;
    }, 100);
  });
  
  profilePic.addEventListener("mouseout", () => {
    clearInterval(interval);
    profilePic.src = "profile_pics/profile1.jpg";
  });
  
  const navText = document.getElementById("navText");
  window.addEventListener("scroll", () => {
    const about = document.getElementById("about").getBoundingClientRect();
    const projects = document.getElementById("projects").getBoundingClientRect();
  
    if (about.top <= window.innerHeight / 2 && about.bottom >= window.innerHeight / 2) {
      navText.textContent = "I AM Abinav Pallathoor";
    } else if (projects.top <= window.innerHeight && projects.bottom >= 0) {
      navText.textContent = "I AM a Maker";
    } else {
      navText.textContent = "I AM";
    }
  });
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
  
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });