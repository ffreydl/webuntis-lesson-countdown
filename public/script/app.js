document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  setUpEventListeners();
  checkLoginStatus();
});

function setUpEventListeners() {
  console.log('Setting up event listeners');
  document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const school = document.getElementById('school').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (school && username && password) {
      saveCredentials(school, username, password);
      displayMainSection();
      fetchTimetable(school, username, password);
    }
  });

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearCredentials();
      displayLoginSection();
    });
  }
}

function saveCredentials(school, username, password) {
  console.log(`Saving credentials: ${school}, ${username}`);
  localStorage.setItem('school', school);
  localStorage.setItem('username', username);
  localStorage.setItem('password', password);
}

function clearCredentials() {
  console.log('Clearing credentials');
  localStorage.removeItem('school');
  localStorage.removeItem('username');
  localStorage.removeItem('password');
}

function checkLoginStatus() {
  console.log('Checking login status');
  const school = localStorage.getItem('school');
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');

  if (school && username && password) {
    displayMainSection();
    fetchTimetable(school, username, password);
  } else {
    displayLoginSection();
  }
}

function displayMainSection() {
  console.log('Displaying main section');
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainSection').style.display = 'flex';
}

function displayLoginSection() {
  console.log('Displaying login section');
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('mainSection').style.display = 'none';
}

function fetchTimetable(school, username, password) {
  console.log(`Fetching timetable for: ${school}, ${username}`);
  fetch('/api/timetable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ school, username, password }),
  })
  .then(response => response.json())
  .then(data => {
    // 'data' contains timetable information
    setInterval(() => {
      updateTimetableDisplay(data);
    }, 1000);
  })
  .catch(error => {
    console.error('Error fetching timetable:', error);
  });
}

function updateTimetableDisplay(timetableData) {
  console.log('Updating timetable display', timetableData);
  const currentTime = new Date();
  // currentTime.setHours(10, 44, 0); // For testing specific times, if needed
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();
  const totalCurrentSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  // Define break times (10:30 to 10:45) in seconds since start of the day
  const breakStartTime = 10 * 3600 + 30 * 60;
  const breakEndTime = 10 * 3600 + 45 * 60;
  
  let currentLessonFound = false;
  let isBreakTime = totalCurrentSeconds >= breakStartTime && totalCurrentSeconds <= breakEndTime;

  // Handle the break time separately
  if (isBreakTime) {
    let totalRemainingSeconds = breakEndTime - totalCurrentSeconds;
    let remainingMinutes = Math.floor(totalRemainingSeconds / 60);
    let remainingSeconds = totalRemainingSeconds % 60;

    document.getElementById('currentLesson').innerHTML = `Kurze Pause`;
    document.getElementById('countdown').innerHTML = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    document.querySelector('#teacher span').innerHTML = '/';
    return;
  }

  // Sort the timetable data just in case it's not already sorted
  timetableData.sort((a, b) => a.startTime - b.startTime);

  // Find the current lesson and the next lesson
  for (let lesson of timetableData) {
    const lessonStartSeconds = Math.floor(lesson.startTime / 100) * 3600 + (lesson.startTime % 100) * 60;
    const lessonEndSeconds = Math.floor(lesson.endTime / 100) * 3600 + (lesson.endTime % 100) * 60;

    if (totalCurrentSeconds >= lessonStartSeconds && totalCurrentSeconds <= lessonEndSeconds) {
      // In lesson
      currentLessonFound = true;
      const remainingSeconds = lessonEndSeconds - totalCurrentSeconds;
      const remainingMinutes = Math.floor(remainingSeconds / 60);
      const remainingExtraSeconds = remainingSeconds % 60;

      const subject = lesson.su[0].longname;
      const teacherNames = lesson.te.map(teacher => teacher.longname).join(", ");

      document.querySelector('#currentLesson span').innerHTML = subject;
      document.getElementById('countdown').innerHTML = `${remainingMinutes.toString().padStart(2, '0')}:${remainingExtraSeconds.toString().padStart(2, '0')}`;
      document.querySelector('#teacher span').innerHTML = teacherNames;
      break;
    }
  }

  if (!currentLessonFound) {
    // Not in lesson
    const nextLesson = timetableData.find(lesson => Math.floor(lesson.startTime / 100) * 3600 + (lesson.startTime % 100) * 60 > totalCurrentSeconds);
    if (nextLesson) {
      const nextLessonStartSeconds = Math.floor(nextLesson.startTime / 100) * 3600 + (nextLesson.startTime % 100) * 60;
      const remainingSeconds = nextLessonStartSeconds - totalCurrentSeconds;
      const remainingMinutes = Math.floor(remainingSeconds / 60);
      const remainingExtraSeconds = remainingSeconds % 60;

      document.getElementById('currentLesson').innerHTML = "Freistunde";
      document.getElementById('countdown').innerHTML = `${remainingMinutes.toString().padStart(2, '0')}:${remainingExtraSeconds.toString().padStart(2, '0')}`;
      document.querySelector('#teacher span').innerHTML = "/";
    } else {
      document.getElementById('currentLesson').innerHTML = "Der Schultag ist vorbei.";
      document.getElementById('countdown').innerHTML = "00:00";
      document.querySelector('#teacher span').innerHTML = "";
    }
  }
}