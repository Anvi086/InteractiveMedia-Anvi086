const video = document.querySelector("#custom-video-player");
const playPauseBtn = document.querySelector("#play-pause-btn");
const playPauseImg = document.querySelector("#play-pause-img");
const progressBar = document.querySelector("#progress-bar-fill");

// removed the native controls attribute here since I'm building my own 
// custom controls below - didn't want both showing up at once
video.removeAttribute("controls");

// left this commented out since I ended up calling togglePlayPause() 
// directly from the onclick in my HTML instead of adding the listener here
// playPauseBtn.addEventListener("click", togglePlayPause);

video.addEventListener("timeupdate", updateProgressBar);

// swaps the play/pause icon depending on whether the video is currently 
// playing, paused, or ended - checked .ended too so it flips back to the 
// play icon once the video finishes instead of staying stuck on pause

function togglePlayPause() {
  if (video.paused || video.ended) {
    video.play();
    playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/pause--v1.png";
  } else {
    video.pause();
    playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/play--v1.png";
  }
}

// works out how far through the video we are as a percentage, then sets 
// that as the width of my custom progress bar fill
function updateProgressBar() {
  const value = (video.currentTime / video.duration) * 100;
  progressBar.style.width = value + "%";
}

// used Math.max/Math.min here so rewinding/forwarding can't push the 
// video's currentTime below 0 or past the end of the video
function rewind() {
  video.currentTime = Math.max(0, video.currentTime - 10);
}

function fastForward() {
  video.currentTime = Math.min(video.duration, video.currentTime + 10);
}

// toggles fullscreen using the Fullscreen API - checked 
// document.fullscreenElement first so the button works as both an 
// enter and exit fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    video.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// set up my three themes as an array so I can just cycle through the 
// index instead of writing separate logic for each theme
const themes = ["light", "dark", "high-contrast"];
let themeIndex = 0;


// applies the theme by setting a data-theme attribute on <html>, which my 
// CSS custom properties key off of. also updates the button text and 
// saves the choice to localStorage so it persists if you reload the page
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector("#theme-btn").textContent = theme.replace("-", " ");
  localStorage.setItem("theme", theme);
}

// steps to the next theme in the array, wrapping back to the start with %
function cycleTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  applyTheme(themes[themeIndex]);
}

// on page load, check localStorage for a saved theme so the site 
// remembers your last choice instead of always resetting to light
const savedTheme = localStorage.getItem("theme") || "light";
themeIndex = themes.indexOf(savedTheme);
applyTheme(savedTheme);


// this is my main interactive feature - jumping the video to a step's 
// timestamp when its button is clicked
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("custom-video-player");
  const stepButtons = document.querySelectorAll(".step-btn");

  // each step button has a data-time attribute (in seconds) - grabbing 
  // that and setting it as the video's currentTime, then playing 
  // straight away so you don't have to also hit play separately
  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const time = parseFloat(btn.dataset.time);
      video.currentTime = time;
      video.play();
    });
  });

  // as the video plays, this checks which step's timestamp we've most 
  // recently passed and highlights that one - loops through all the 
  // buttons each time so whichever has the latest timestamp <= current 
  // time becomes "current"
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