const { google } = require('googleapis');

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar'],
  process.env.GOOGLE_CALENDAR_DELEGATE_EMAIL
);

const calendar = google.calendar({ version: 'v3', auth });

exports.createCalendarEvent = async (req, res) => {
  try {
    const { startDateTime, endDateTime, attendeeEmail, summary, description } = req.body;

    // Validate inputs
    if (!startDateTime || !endDateTime || !attendeeEmail || !summary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create event with Google Meet
    const event = {
      summary,
      description: description || 'Consultation session',
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: true
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    res.status(200).json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink
    });

  } catch (error) {
    console.error('Calendar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message
    });
  }
};