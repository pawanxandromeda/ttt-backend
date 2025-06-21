// controllers/calendarController.js
const { google } = require('googleapis');

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar('v3');

exports.createCalendarEvent = async (req, res) => {
  try {
    const {
      startDateTime,
      endDateTime,
      attendeeEmail,
      summary,
      description
    } = req.body;

    const event = {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
      attendees: [{ email: attendeeEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });

    res.status(200).json({
      success: true,
      event: response.data,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Google Calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message,
    });
  }
};
