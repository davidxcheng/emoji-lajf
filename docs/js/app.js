"use strict";

//import calendarDateMarkupComposer from "./calendarDateMarkupComposer.js";

var elTitle = document.getElementById("title");
var elScoreboard = document.getElementById("scoreboard");
var elCalendar = document.getElementById("calendar");
var _activities = [];

var months = [
  { name: "January", numberOfDays: 31 },
  { name: "February", numberOfDays: 28 },
  { name: "March", numberOfDays: 31 },
  { name: "April", numberOfDays: 30 },
  { name: "May", numberOfDays: 31 },
  { name: "June", numberOfDays: 30 },
  { name: "July", numberOfDays: 31 },
  { name: "August", numberOfDays: 31 },
  { name: "September", numberOfDays: 30 },
  { name: "October", numberOfDays: 31 },
  { name: "November", numberOfDays: 30 },
  { name: "December", numberOfDays: 31 }
];

var days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function createScoreboardMarkup(data) {
  var markup = "";
  var summary = Object.entries(_activities).reduce((acc, curr) => {
    acc[curr[0]] = {
      ...curr[1],
      quantity: 0,
    }

    return acc;
  }, {});

  data.forEach(log => {
    summary[log.activity].quantity += log.quantity
  });

  for (const prop in summary) {
    if (summary.hasOwnProperty(prop)) {
      var activity = summary[prop];
      var quantity = activity.quantity;

      quantity += activity.unit ? ` ${activity.unit}` : "";

      markup += `<div>${activity.glyph}<small>${quantity}</small></div>`;
    }
  }

  return markup;
}

function createCalendarDateMarkup(date, log) {
  var dayOfWeek = date.getDay();
  var day = date.getDate();
  var isSabbath = dayOfWeek === 0;
  var dateAsIso = date.toISOString().substring(0, 10);

  var activitiesMarkup = log.reduce((acc, logEntry) => {
    if (dateAsIso === logEntry.date) {
      var activity = _activities[logEntry.activity];
      acc += createLogEntryMarkup(activity, logEntry);
    }

    return acc;
  }, "");

  return `
    <div class="date-container" data-date='${dateAsIso}'>
      <div class="date">
        <b class="dayOfMonth ${isSabbath ? 'sabbath' : ''}">${day}</b>
        <small class="day ${isSabbath ? 'sabbath' : ''}">
          ${days[dayOfWeek]}
        </small>
        <span>${activitiesMarkup}</span>
      </div>
    </div>`;
}

function createLogEntryMarkup(activity, logEntry) {
  if (activity.isBinary) {
    return `<span class="log-entry">${activity.glyph}</span>`;
  }

  return `<span class="log-entry">${activity.glyph}<small class="quantity">${logEntry.quantity} ${activity.unit}</small></span>`;
}

function render(month, data) {
  elTitle.innerHTML = `${months[month.month].name} ${month.year}`;
  elScoreboard.innerHTML = createScoreboardMarkup(data);
  let outputMarkup = "";

  for (var day = 1; day <= months[month.month].numberOfDays; day++) {
    var currentDate = new Date(month.year, month.month, day, 12);
    outputMarkup += createCalendarDateMarkup(currentDate, data)
  }

  elCalendar.innerHTML = outputMarkup;
  elCalendar.addEventListener("click", async e => {
    var elDateContent = findDateContainerParent(e.target);

    if (elDateContent) {
      var response = await fetch('data/db.json');
      var log = (await response.json()).log;
      var selectedDate = elDateContent.dataset.date;

      var entries = log.reduce((acc, curr) => {
        if (curr.date === selectedDate) {
          acc.push(curr);
        }

        return acc;
      }, []);

      if (!entries.length) {
        // Show add UI
        console.log('Show add UI')
      } else {
        // Toggle activity details
        console.log('Toggle activity details')
      }
    }
  });
}

function findDateContainerParent(el) {
  if (!el.classList.contains("date-container")) {
    return findDateContainerParent(el.parentElement);
  }

  return el.tagName === "BODY" ? null : el;
}

window.addEventListener("load", async () => {
  var requestedMonth = window.location.hash.length && window.location.hash.match(/20\d{2}\/[0-1]\d/);
  var selectedDate = new Date();

  if (requestedMonth) {
    var yyyyMM = requestedMonth[0];
    var year = parseInt(yyyyMM.slice(0, 4));
    var month = parseInt(yyyyMM.slice(-2));
    selectedDate = new Date(year, (month - 1), 15);
  }

  var month = {
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth()
  };

  window.history.pushState({ month }, "Month", `#${month.year}/${(month.month + 1).toString().padStart(2, '0')}`);
  var data = await fetchData(month);

  render(month, data);
});

async function fetchData(month) {
  var response = await fetch('data/db.json');
  var data = await response.json();

  _activities = data.activities.reduce((acc, curr) => {
    if (!acc[curr.name]) {
      acc[curr.name] = {
        glyph: curr.icon.glyph,
        isBinary: curr.settings.isBinary,
        unit: curr.settings.isBinary ? "" : curr.settings.unit
      }
    }
    return acc;
  }, {});

  var yyyyMM = `${month.year}-${(month.month + 1).toString().padStart(2, "0")}`;
  var logEntries = data.log.filter(entry => entry.date.startsWith(yyyyMM));

  return logEntries;
}

window.addEventListener("popstate", async e => {
  if (e.state) {
    var data = await fetchData(e.state.month);
    render(month, data);
  }
});
