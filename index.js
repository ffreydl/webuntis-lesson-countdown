const express = require('express');
const { WebUntis } = require('webuntis');

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/api/timetable', async (req, res) => {
  const { school, username, password } = req.body;
  const untis = new WebUntis(school, username, password, `mese.webuntis.com`);
  
  try {
    await untis.login();
    const timetable = await untis.getOwnTimetableForToday();
    res.json(timetable);
  } catch (error) {
    console.error('Failed to fetch timetable:', error);
    res.status(500).send('Error fetching timetable');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});