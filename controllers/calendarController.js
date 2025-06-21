const { google } = require('googleapis');
const serviceAccount = require('../service-account-key.json'); // Your service account file

// Initialize Google Calendar API
const calendar = google.calendar('v3');
const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/calendar'],
  null
);

// Endpoint to create calendar event
app.post('/calendar/create-event', async (req, res) => {
  try {
    const {
      packageId,
      startDateTime,
      endDateTime,
      attendeeEmail,
      summary,
      description
    } = req.body;

    // Create event
    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata', // IST
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Kolkata',
      },
      attendees: [{ email: attendeeEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Insert event into primary calendar
    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary', // Or a specific calendar ID
      resource: event,
      sendUpdates: 'all', // Sends notifications to attendees
    });

    res.status(200).json({
      success: true,
      event: response.data,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message,
    });
  }
});