let currentSong = new Audio();
let songs;
let currFolder;

function formatTime(secondsWithMilliseconds) {
  const totalSeconds = Math.floor(secondsWithMilliseconds); // Get the whole seconds part
  const milliseconds = Math.round((secondsWithMilliseconds % 1) * 1000); // Convert the fractional part to milliseconds

  const minutes = Math.floor(totalSeconds / 60); // Calculate the minutes
  const seconds = totalSeconds % 60; // Calculate the remaining seconds

  // If seconds or milliseconds are less than 10, pad them with a leading zero
  const paddedSeconds = seconds < 10 ? "0" + seconds : seconds;

  // Return the formatted time as "Minutes:Seconds"
  return `${minutes}:${paddedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let s = await fetch(`http://192.168.1.126:3000/${folder}`);
  let response = await s.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let aS = div.getElementsByTagName("a");
  songs = [];
  for (let i = 0; i < aS.length; i++) {
    const element = aS[i];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href);
    }
  }

  // show all the songs in the playlist
  let songUl = document
    .querySelector(".musicLists")
    .getElementsByTagName("ul")[0];

  songUl.innerHTML = "";

  for (const song of songs) {
    const cleanTrackName = song
      .split(`${currFolder}`)[1]
      .replace(/^\/+/, '') 
      .replaceAll("%20", " ")
      .replaceAll("(128 kbps)", "")
      .replaceAll(".mp3", "");
  
    songUl.innerHTML += `<li> 
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#fcfcfc" fill="none">
        <circle cx="6.5" cy="18.5" r="3.5" stroke="currentColor" stroke-width="1.5" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 18.5L10 7C10 6.07655 10 5.61483 10.2635 5.32794C10.5269 5.04106 11.0175 4.9992 11.9986 4.91549C16.022 4.57222 18.909 3.26005 20.3553 2.40978C20.6508 2.236 20.7986 2.14912 20.8993 2.20672C21 2.26432 21 2.4315 21 2.76587V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 10C15.8667 10 19.7778 7.66667 21 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="songInfo">
        <div class="songName">${cleanTrackName}</div>
        <div class="artist">Bipin</div>
      </div>
      <div class="playButtons list"></div></li>`;
  }
  

  // event listener to each song
  Array.from(
    document.querySelector(".musicLists").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (elements) => {
      playMusic(e.querySelector(".songInfo").firstElementChild.innerHTML);
    });
  });
}
const playMusic = (track, pause = false) => {
  return new Promise((resolve, reject) => {
    // 1. Set the source, ensuring no extra slashes are added
    let folderPath = currFolder.endsWith('/') ? currFolder.slice(0, -1) : currFolder;
    currentSong.src = `${folderPath}/${encodeURIComponent(track)}(128%20kbps).mp3`;

    if (track.length <= 80) {
      document.querySelector(".musicInfo").innerHTML = `<div> ${track}</div>`;
    } else {
      document.querySelector(
        ".musicInfo"
      ).innerHTML = `<div class="musicInfo marquee-container"><div class="marquee-text">${track}</div>`;
    }

    // 2. Wait for the audio to load
    currentSong.onloadeddata = () => {
      try {
        // 3. Play the audio once it's loaded
        if (!pause) {
          currentSong.play();
          playPause.src = "/images/pause.svg";
        }

        resolve(); // Resolve the promise
      } catch (error) {
        reject(error); // Reject the promise if there's an error
      }
    };
  });
};


async function displayAlbums() {
  let s = await fetch(`http://192.168.1.126:3000/songs/`);
  let response = await s.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  // Step 1: Create the cards dynamically
  Array.from(anchors).forEach(async (e) => {
    if (e.href.includes("/songs")) {
      let folder = e.href.split("/").slice(-2)[0];

      // Fetch the metadata of the folder
      let j = await fetch(
        `http://192.168.1.126:3000/songs/${folder}/info.json`
      );
      let response = await j.json();

      // Add the card to the container
      cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
            <div class="play">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                data-encore-id="icon"
                role="img"
                aria-hidden="true"
                viewBox="0 0 24 24"
                class="Svg-sc-ytk21e-0 bneLcE"
              >
                <path
                  d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"
                ></path>
              </svg>
            </div>
            <img
              src="/songs/${folder}/covers.jpeg"
              alt="${response.title}"
            />
            <h2>${response.title}</h2>
            <p>${response.description}</p>
          </div>`;
    }
  });

  // Step 2: Attach event listeners after the cards have been created
  setTimeout(() => {
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        let folder = item.currentTarget.dataset.folder;
        songs = await getSongs(`songs/${folder}`);
        // Now, do something with the `songs` like updating the UI
      });
    });
  }, 100); // Slight delay to ensure cards are in the DOM
}

async function main() {
  await getSongs("songs/English/");
  playMusic(songs[0], true);

  // display all the albums on the page
  displayAlbums();

  // make the default song
  if (songs.length > 0) {
    const defaultSong = songs[0]
      .split(`${currFolder}`)[1]
      .replaceAll("%20", " ")
      .replaceAll("(128 kbps)", "")
      .replaceAll(".mp3", "");
    await playMusic(defaultSong, true); // Pass `true` to load but not play immediately
  }

  let playPause = document.getElementById("playPause");
  playPause.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playPause.src = "/images/pause.svg"; // Update the source of the clicked element
    } else {
      currentSong.pause();
      playPause.src = "/images/play_music.svg"; // Update the source of the clicked element
    }
  });

  // for time update
  currentSong.addEventListener("timeupdate", () => {
    const currentTime = currentSong.currentTime;
    const duration = currentSong.duration;

    // Check if duration is a valid number
    if (!isNaN(duration) && duration > 0) {
      document.querySelector(".runningTime").innerHTML = `${formatTime(
        currentTime
      )} `;
      document.querySelector(".duration").innerHTML = `${formatTime(
        duration
      )} `;

      const progressPercentage = (currentTime / duration) * 100;
      // Update the circle's position based on the progress percentage
      document.querySelector(".circle").style.left = progressPercentage + "%";
    } else {
      // Handle case where duration is not available yet
      document.addEventListener('DOMContentLoaded', () => {
       // Your code to set innerHTML goes here
       document.querySelector(".songTime").innerHTML = `${formatTime(currentTime)} / --:--`;
   });
    }
  });

  const seekBar = document.querySelector(".seekBar");
  const circle = document.querySelector(".circle");
  let isDragging = false;

  // Function to calculate time based on position
  function updateTimeBasedOnPosition(xPosition) {
    const seekBarRect = seekBar.getBoundingClientRect();
    const seekBarWidth = seekBarRect.width;

    // Calculate the percentage of the seek bar that has been dragged
    const percentage = Math.max(
      0,
      Math.min(1, (xPosition - seekBarRect.left) / seekBarWidth)
    );
    // Update the current time of the song
    currentSong.currentTime = percentage * currentSong.duration;

    // Update the circle position
    circle.style.left = percentage * 100 + "%";
  }

  // Mouse down event to start dragging
  circle.addEventListener("mousedown", (e) => {
    isDragging = true;
    updateTimeBasedOnPosition(e.clientX);
  });

  // Mouse move event to drag the circle
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      updateTimeBasedOnPosition(e.clientX);
    }
  });

  // Mouse up event to stop dragging
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
    }
  });

  // Touch events for mobile compatibility
  circle.addEventListener("touchstart", (e) => {
    isDragging = true;
    updateTimeBasedOnPosition(e.touches[0].clientX);
  });

  document.addEventListener("touchmove", (e) => {
    if (isDragging) {
      updateTimeBasedOnPosition(e.touches[0].clientX);
    }
  });

  document.addEventListener("touchend", () => {
    if (isDragging) {
      isDragging = false;
    }
  });
  seekBar.addEventListener("click", (e) => {
    updateTimeBasedOnPosition(e.clientX);
  });

  const hamClose = document.getElementById("hamClose");
  const hamOpen = document.getElementById("hamOpen");
  const leftMenu = document.querySelector(".left");
  hamClose.addEventListener("click", () => {
    leftMenu.style.left = "-100%";
  });

  hamOpen.addEventListener("click", () => {
    leftMenu.style.left = 0;
  });

  let next = document.getElementById("next");
  let previous = document.getElementById("previous");
  let currentIndex = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
  next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
      playMusic(
        songs[currentIndex]
          .split("/songs/")[1]
          .replaceAll("%20", " ")
          .replaceAll("(128 kbps)", "")
          .replaceAll(".mp3", "")
      );
    }
  });

  previous.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      playMusic(
        songs[currentIndex]
          .split("/songs/")[1]
          .replaceAll("%20", " ")
          .replaceAll("(128 kbps)", "")
          .replaceAll(".mp3", "")
      );
    }
  });
  // volume Control
  let volumeControl = document.getElementById("volumeRange");
  let volumeIcon = document.getElementById("volumeIcon");
  let isMuted = false; // To track whether the audio is muted or not
  let lastVolume = volumeControl.value / 100; // Store the last volume before muting
  
  volumeControl.addEventListener("input", (e) => {
      let volume = e.target.value / 100;
      currentSong.volume = volume;
  
      // Change icon based on volume value
      if (volume === 0) {
          volumeIcon.src = "/images/mute.svg";
          isMuted = true;
      } else {
          volumeIcon.src = "/images/volume.svg";
          isMuted = false;
          lastVolume = volume; // Update lastVolume to the current volume
      }
  });
  
  volumeControl.addEventListener("change", (e) => {
      let volume = e.target.value / 100;
      currentSong.volume = volume;
  
      // Change icon based on volume value
      if (volume === 0) {
          volumeIcon.src = "/images/mute.svg";
          isMuted = true;
      } else {
          volumeIcon.src = "/images/volume.svg";
          isMuted = false;
          lastVolume = volume; // Update lastVolume to the current volume
      }
  });
  
  // Add click event listener to volume icon for muting/unmuting
  volumeIcon.addEventListener("click", () => {
      if (isMuted) {
          // Unmute and restore the previous volume level
          currentSong.volume = lastVolume;
          volumeControl.value = lastVolume * 100; // Update the slider to the last volume level
          volumeIcon.src = "/images/volume.svg";
          isMuted = false;
      } else {
          // Mute
          lastVolume = currentSong.volume; // Store the current volume before muting
          currentSong.volume = 0;
          volumeControl.value = 0; // Update the slider to reflect muted state
          volumeIcon.src = "/images/mute.svg";
          isMuted = true;
      }
  });
  
  
}
main();
