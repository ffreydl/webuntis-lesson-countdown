// Constants for time calculations
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const BREAK_START_TIME = 10 * SECONDS_PER_HOUR + 30 * SECONDS_PER_MINUTE; // 10:30 AM in seconds
const BREAK_END_TIME = 10 * SECONDS_PER_HOUR + 45 * SECONDS_PER_MINUTE; // 10:45 AM in seconds
const BREAK_START_TIME_2 = 14 * SECONDS_PER_HOUR + 45 * SECONDS_PER_MINUTE; // 14:45 AM in seconds
const BREAK_END_TIME_2 = 14 * SECONDS_PER_HOUR + 50 * SECONDS_PER_MINUTE; // 14:50 AM in seconds

// Init application once DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  setUpEventListeners();
  checkLoginStatus();
});

// Set up event listeners for login form and logout button
function setUpEventListeners() {
  console.log("Setting up event listeners");
  // EVent listener for login form submission
  document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const school = document.getElementById("school").value.trim();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      if (school && username && password) {
        saveCredentials(school, username, password);
        displayMainSection();
        fetchTimetable(school, username, password);
      }
    });

  // Event listener for logout button
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearCredentials();
      displayLoginSection();
    });
  }
}

// Save credentials to local storage
function saveCredentials(school, username, password) {
  console.log(`Saving credentials: ${school}, ${username}`);
  localStorage.setItem("school", school);
  localStorage.setItem("username", username);
  localStorage.setItem("password", password);
}

// Clears user credentials from localStorage
function clearCredentials() {
  console.log("Clearing credentials");
  localStorage.removeItem("school");
  localStorage.removeItem("username");
  localStorage.removeItem("password");
}

// Check login status and display main section if logged in
function checkLoginStatus() {
  console.log("Checking login status");
  const school = localStorage.getItem("school");
  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");

  if (school && username && password) {
    displayMainSection();
    fetchTimetable(school, username, password);
  } else {
    displayLoginSection();
  }
}

// Display main section and fetch timetable data
function displayMainSection() {
  console.log("Displaying main section");
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("mainSection").style.display = "flex";
}

// Display login section of the application
function displayLoginSection() {
  console.log("Displaying login section");
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("mainSection").style.display = "none";
}

// Fetches the timetable data from the server
function fetchTimetable(school, username, password) {
  console.log(`Fetching timetable for: ${school}, ${username}`);
  fetch("/api/timetable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ school, username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      // 'data' contains timetable information
      // Updates timetable display every second
      setInterval(() => {
        updateTimetableDisplay(data);
      }, 1000);
    })
    .catch((error) => {
      console.error("Error fetching timetable:", error);
    });
}

// Updates the timetable display with current or next lesson or break information
function updateTimetableDisplay(timetableData) {
  console.log("Updating timetable display", timetableData);

  // Function to calculate remaining time in minutes and seconds
  const getRemainingTime = (endSeconds, currentSeconds) => {
    let remainingSeconds = endSeconds - currentSeconds;
    let remainingMinutes = Math.floor(remainingSeconds / SECONDS_PER_MINUTE);
    let remainingExtraSeconds = remainingSeconds % SECONDS_PER_MINUTE;
    return { remainingMinutes, remainingExtraSeconds };
  };

  // Function to update the display with current or next lesson or break information
  const updateDisplay = () => {
    const currentTime = new Date();
    const totalCurrentSeconds = currentTime.getHours() * SECONDS_PER_HOUR + currentTime.getMinutes() * SECONDS_PER_MINUTE + currentTime.getSeconds();
    let isBreakTime = (totalCurrentSeconds >= BREAK_START_TIME && totalCurrentSeconds < BREAK_END_TIME) || (totalCurrentSeconds >= BREAK_START_TIME_2 && totalCurrentSeconds < BREAK_END_TIME_2);

    // Check if it is break time or lesson time
    if (isBreakTime) {
      let remainingMinutes, remainingExtraSeconds;
      if (totalCurrentSeconds >= BREAK_START_TIME_2) {
        ({ remainingMinutes, remainingExtraSeconds } = getRemainingTime(BREAK_END_TIME_2, totalCurrentSeconds));
      } else {
        ({ remainingMinutes, remainingExtraSeconds } = getRemainingTime(BREAK_END_TIME, totalCurrentSeconds));
      }

      document.getElementById("currentLesson").textContent = `Kurze Pause`;
      document.getElementById("countdown").textContent = `${remainingMinutes.toString().padStart(2, "0")}:${remainingExtraSeconds.toString().padStart(2, "0")}`;
      document.querySelector("#teacher span").textContent = "/";
    } else {
      let currentLessonFound = false;
      // Sort timetable data by start time
      timetableData.sort((a, b) => a.startTime - b.startTime);

      // Iterate over timetable data to find current lesson
      for (let lesson of timetableData) {
        const startSeconds = Math.floor(lesson.startTime / 100) * SECONDS_PER_HOUR + (lesson.startTime % 100) * SECONDS_PER_MINUTE;
        const endSeconds = Math.floor(lesson.endTime / 100) * SECONDS_PER_HOUR + (lesson.endTime % 100) * SECONDS_PER_MINUTE;

        // Check if current time is within lesson time
        if (totalCurrentSeconds >= startSeconds && totalCurrentSeconds < endSeconds) {
          currentLessonFound = true;
          const { remainingMinutes, remainingExtraSeconds } = getRemainingTime(
            endSeconds,
            totalCurrentSeconds
          );
          // Update teacher and subject information
          const subject = lesson.su[0].longname.length > 20 ? lesson.su[0].name : lesson.su[0].longname;
          const teacherNames = lesson.te.map((teacher) => teacher.longname).join(", ");
          document.querySelector("#currentLesson span").textContent = subject;
          document.getElementById("countdown").textContent = `${remainingMinutes.toString().padStart(2, "0")}:${remainingExtraSeconds.toString().padStart(2, "0")}`;
          document.querySelector("#teacher span").textContent = teacherNames;
          break;
        }
      }
      // If current lesson is not found, display end of school day message
      if (!currentLessonFound) {
        document.getElementById("currentLesson").textContent = "Der Schultag ist vorbei.";
        document.getElementById("countdown").textContent = "00:00";
        document.querySelector("#teacher span").textContent = "";
      }
    }
  };

  // Call updateDisplay function every second
  updateDisplay();
  setInterval(updateDisplay, 1000);
}