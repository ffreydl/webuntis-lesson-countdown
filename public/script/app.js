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
    updateTimetableDisplay(data);
  })
  .catch(error => {
    console.error('Error fetching timetable:', error);
  });
}

function updateTimetableDisplay(timetableData) {
  console.log('Updating timetable display', timetableData);
  const currentTime = new Date();
  //currentTime.setHours(8, 42, 15, 0); // For testing specific times, if needed
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const totalCurrentMinutes = currentHours * 60 + currentMinutes;

  let currentLessonFound = false;
  let isBreakTime = (totalCurrentMinutes >= 630 && totalCurrentMinutes <= 645); // 10:30 to 10:45

  // Handle the break time separately
  let totalRemainingMinutes = 645 - totalCurrentMinutes;
  let remainingHours = Math.floor(totalRemainingMinutes / 60);
  let remainingMinutes = totalRemainingMinutes % 60;
  if (isBreakTime) {
    document.getElementById('currentLesson').innerHTML = `Kurze Pause`;
    document.getElementById('countdown').innerHTML = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    document.querySelector('#teacher span').innerHTML = '/';
    return;
  }

  timetableData.sort((a, b) => a.startTime - b.startTime); // Ensure the data is sorted by start time

  for (let lesson of timetableData) {
    const startHours = Math.floor(lesson.startTime / 100);
    const startMinutes = lesson.startTime % 100;
    const endHours = Math.floor(lesson.endTime / 100);
    const endMinutes = lesson.endTime % 100;
  
    const totalStartMinutes = startHours * 60 + startMinutes;
    const totalEndMinutes = endHours * 60 + endMinutes;
  
    // Check if current time is during a lesson
    if (totalCurrentMinutes >= totalStartMinutes && totalCurrentMinutes <= totalEndMinutes) {
      // Get the remaining time in seconds
      const currentTimeInSeconds = (currentHours * 60 + currentMinutes) * 60 + currentTime.getSeconds();
      const totalEndSeconds = totalEndMinutes * 60;
      const remainingSeconds = totalEndSeconds - currentTimeInSeconds;
  
      // Convert remaining time back into minutes and seconds
      const remainingMinutes = Math.floor(remainingSeconds / 60);
      const remainingExtraSeconds = remainingSeconds % 60;
  
      const subject = lesson.su && lesson.su.length > 0 ? lesson.su[0].longname : "N/A";
  
      // Filter and join teacher names
      const validTeacherNames = lesson.te
        .map(teacher => teacher.longname)
        .filter(name => name && !/^-+|_+$/.test(name))  // Exclude invalid names
        .join(", ");
  
      const teacherDisplay = validTeacherNames || "N/A";
      
      document.querySelector('#currentLesson span').innerHTML = `${subject}`;
      document.getElementById('countdown').innerHTML = `${remainingMinutes.toString().padStart(2, '0')}:${remainingExtraSeconds.toString().padStart(2, '0')}`;
      document.querySelector('#teacher span').innerHTML = `${teacherDisplay}`;
  
      currentLessonFound = true;
      break;
    }
  }  

  // After iterating through all lessons
  if (!currentLessonFound) {
    const latestEndTime = Math.max(...timetableData.map(lesson => lesson.endTime));
    const earliestStartTime = Math.min(...timetableData.map(lesson => lesson.startTime));
    // Convert latestEndTime and earliestStartTime from HHMM to minutes
    const latestEndTimeMinutes = Math.floor(latestEndTime / 100) * 60 + (latestEndTime % 100);
    const earliestStartTimeMinutes = Math.floor(earliestStartTime / 100) * 60 + (earliestStartTime % 100);

    // Find the next lesson after the current time
    const nextLesson = timetableData.find(lesson => {
      const startHours = Math.floor(lesson.startTime / 100);
      const startMinutes = lesson.startTime % 100;
      const totalStartMinutes = startHours * 60 + startMinutes;
      return totalStartMinutes > totalCurrentMinutes;
    });

    // Calculate the remaining time until the next lesson starts
    if (totalCurrentMinutes < earliestStartTimeMinutes) {
      document.getElementById('currentLesson').innerHTML = "Der Schultag hat noch nicht begonnen.";
      document.getElementById('countdown').innerHTML = "00:00";
      document.querySelector('#teacher span').innerHTML = "";
    } else if (totalCurrentMinutes < latestEndTimeMinutes && nextLesson) {
      const nextLessonStartHours = Math.floor(nextLesson.startTime / 100);
      const nextLessonStartMinutes = nextLesson.startTime % 100;
      const totalNextStartMinutes = nextLessonStartHours * 60 + nextLessonStartMinutes;
      const remainingMinutes = totalNextStartMinutes - totalCurrentMinutes;

      document.getElementById('currentLesson').innerHTML = "Freistunde";
      document.getElementById('countdown').innerHTML = `Nächste Stunde in: ${remainingMinutes} Minuten`;
      document.querySelector('#teacher span').innerHTML = "/";
    } else {
      document.getElementById('currentLesson').innerHTML = "Der Schultag ist vorbei.";
      document.getElementById('countdown').innerHTML = "00:00";
      document.querySelector('#teacher span').innerHTML = "";
    }
  }
}
