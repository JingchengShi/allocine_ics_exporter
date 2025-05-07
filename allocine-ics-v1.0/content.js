
function parseTimeString(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
}

function getDateFromLabel(label) {
  const today = new Date();
  if (label.includes("Aujourd'hui")) return today;
  if (label.includes("Demain")) return new Date(today.getTime() + 86400000);
  const naturalMatch = label.match(/\b(\d{1,2})\s+([a-zéû]+)/i);
  if (naturalMatch) {
    const [_, dayStr, monthStr] = naturalMatch;
    const months = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4,
      juin: 5, juillet: 6, août: 7, septembre: 8,
      octobre: 9, novembre: 10, décembre: 11,
      janv: 0, févr: 1, avr: 3, juil: 6, sept: 8, oct: 9, nov: 10, déc: 11
    };
    const monthIndex = months[monthStr.toLowerCase()];
    if (monthIndex !== undefined) {
      const year = today.getFullYear();
      return new Date(year, monthIndex, parseInt(dayStr));
    }
  }
  return new Date('invalid');
}

function generateICS({ title, location, description, start, end }) {
  function formatDate(date) {
    return date.getFullYear().toString() +
           String(date.getMonth() + 1).padStart(2, '0') +
           String(date.getDate()).padStart(2, '0') + 'T' +
           String(date.getHours()).padStart(2, '0') +
           String(date.getMinutes()).padStart(2, '0') + '00';
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Allociné ICS Exporter
BEGIN:VEVENT
UID:${title}-${formatDate(start)}
DTSTAMP:${formatDate(new Date())}
DTSTART;TZID=Europe/Paris:${formatDate(start)}
DTEND;TZID=Europe/Paris:${formatDate(end)}
SUMMARY:${title}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
}

let clickTimer = null;
window.addEventListener('click', () => {
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => insertICSButtons(), 300);
});

function insertICSButtons() {
  const movieLink = document.querySelector('.userspace-my-theaters-showtimes-section-title a');
  const movieTitle = movieLink?.textContent.trim() || 'Film';
  const movieURL = movieLink?.href;
  const dateLabel = document.querySelector('.dropdown-custom.userspace-my-theaters-showtime-dropdown span')?.textContent.trim() || "Aujourd'hui";
  const date = getDateFromLabel(dateLabel);

  const blocks = document.querySelectorAll('.userspace-my-theaters-showtime-details-list');
  blocks.forEach(list => {
    const address = list.closest('.userspace-my-theaters-theater-showtimes-container')?.querySelector('h2')?.textContent.trim() || 'Cinéma';
    const version = list.querySelector('.userspace-my-theaters-showtime-version')?.textContent.trim() || '';

    const slots = list.querySelectorAll('.showtimes-hour-block');
    slots.forEach(slot => {
      if (slot.querySelector('.ics-download-button')) return;

      const timeSpan = slot.querySelector('a span');
      const timeText = timeSpan?.textContent.trim();
      const time = parseTimeString(timeText);
      const start = new Date(date);
      start.setHours(time.hour, time.minute);

      const icsButton = document.createElement('button');
      icsButton.textContent = '.ics';
      icsButton.className = 'ics-download-button';
      icsButton.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'getDuration', url: movieURL }, res => {
          const duration = res?.durationMinutes || 120;
          const end = new Date(start.getTime() + duration * 60000);

          const icsContent = generateICS({ title: movieTitle, location: address, description: version, start, end });

          const weekdayElement = document.querySelector('.userspace-my-theaters-showtime-dropdown span');
          let dateSuffix = weekdayElement ? weekdayElement.textContent.trim().toLowerCase().replace(/\s+/g, '_') : 'jour';

          if (dateSuffix === "aujourd'hui") {
            const d = new Date();
            dateSuffix = `${['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]}_${d.getDate()}_${['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'][d.getMonth()]}`;
          } else if (dateSuffix === "demain") {
            const d = new Date(Date.now() + 86400000);
            dateSuffix = `${['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]}_${d.getDate()}_${['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'][d.getMonth()]}`;
          } else {}

          const dtstart = start.getFullYear().toString() +
                          String(start.getMonth() + 1).padStart(2, '0') +
                          String(start.getDate()).padStart(2, '0') + 'T' +
                          String(start.getHours()).padStart(2, '0') +
                          String(start.getMinutes()).padStart(2, '0') + '00';
          const dtend = end.getFullYear().toString() +
                        String(end.getMonth() + 1).padStart(2, '0') +
                        String(end.getDate()).padStart(2, '0') + 'T' +
                        String(end.getHours()).padStart(2, '0') +
                        String(end.getMinutes()).padStart(2, '0') + '00';
          const dtstamp = new Date();
          const stampString = dtstamp.getFullYear().toString() +
                              String(dtstamp.getMonth() + 1).padStart(2, '0') +
                              String(dtstamp.getDate()).padStart(2, '0') + 'T' +
                              String(dtstamp.getHours()).padStart(2, '0') +
                              String(dtstamp.getMinutes()).padStart(2, '0') + '00';

          const isInvalid = dtstart.includes('NaN') || dtend.includes('NaN') || stampString.includes('NaN');
          const prefix = isInvalid ? 'Error_' : '';

          const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${prefix}${movieTitle.replace(/\s+/g, '_')}_${timeText.replace(':', '')}_${dateSuffix}.ics`;
          a.click();
        });
      };

      const reserver = slot.querySelector('.showtimes-hour-item-booking');
      if (reserver) reserver.replaceWith(icsButton);
    });
  });
}
