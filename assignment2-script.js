const video = document.querySelector("#custom-video-player");
const playPauseBtn = document.querySelector("#play-pause-btn");
const playPauseImg = document.querySelector("#play-pause-img");
const progressBar = document.querySelector("#progress-bar-fill");
video.removeAttribute("controls");
// playPauseBtn.addEventListener("click", togglePlayPause);
video.addEventListener("timeupdate", updateProgressBar);
function togglePlayPause() {
if (video.paused || video.ended) {
video.play();
playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/pause--v1.png";
  } else {
video.pause();
playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/play--v1.png";
  }
}
function updateProgressBar() {
const value = (video.currentTime / video.duration) * 100;
progressBar.style.width = value + "%";
}

function rewind() {
video.currentTime = Math.max(0, video.currentTime - 10);
}

function fastForward() {
video.currentTime = Math.min(video.duration, video.currentTime + 10);
}

function toggleFullscreen() {
if (!document.fullscreenElement) {
video.requestFullscreen();
  } else {
document.exitFullscreen();
  }
}

const themes = ["light", "dark", "high-contrast"];
let themeIndex = 0;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector("#theme-btn").textContent = theme.replace("-", " ");
  localStorage.setItem("theme", theme);
}

function cycleTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  applyTheme(themes[themeIndex]);
}

// On page load, restore saved theme (or default to light)
const savedTheme = localStorage.getItem("theme") || "light";
themeIndex = themes.indexOf(savedTheme);
applyTheme(savedTheme);


// Jump to a timestamp when a step button is clicked
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("custom-video-player");
  const stepButtons = document.querySelectorAll(".step-btn");

  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const time = parseFloat(btn.dataset.time);
      video.currentTime = time;
      video.play();
    });
  });

  // Optional: highlight the current step as the video plays
  video.addEventListener("timeupdate", () => {
    let current = null;
    stepButtons.forEach((btn) => {
      const time = parseFloat(btn.dataset.time);
      if (video.currentTime >= time) {
        current = btn;
      }
    });
    stepButtons.forEach((btn) => btn.classList.remove("active"));
    if (current) current.classList.add("active");
  });
});