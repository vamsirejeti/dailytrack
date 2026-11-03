DailyTrack v1.0

WHAT IT DOES
- Add and edit medicines or supplements with dosage, one scheduled time, start/end dates and notes.
- Mark today's item Taken or Skipped; Undo a status.
- Show today's taken count and recent activity.
- Export and restore a JSON backup.
- Cache the app shell for basic offline reopening after first successful load.

IMPORTANT LIMITATIONS
- This is an installable-style Progressive Web App (PWA), not a native Android APK.
- No scheduled notifications/reminders in v1.0.
- One scheduled time per item in v1.0.
- Data is stored in this browser's localStorage. Clearing browser/site data can erase it.
- Export backups regularly. Restore replaces the current item and log data.
- For Chrome installation on Android, host the folder on an HTTPS site, open it in Chrome, then use menu > Install app / Add to Home screen. For local development, serve it from localhost.

RUN LOCALLY
From this folder run: python -m http.server 8000
Then open http://localhost:8000 in a browser.

This app is a tracking aid, not medical advice. Follow your clinician's instructions for medicine timing and dosage.
