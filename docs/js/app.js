"use strict";

//import calendarDateMarkupComposer from "./calendarDateMarkupComposer.js";

var elTitleText = document.getElementById("title-text");
var elPrevMonth = document.getElementById("prev-month");
var elNextMonth = document.getElementById("next-month");
var elScoreboard = document.getElementById("scoreboard");
var elCalendar = document.getElementById("calendar");
var _activities = [];

var months = [
  {}, // This app doesn't use zero-based value for month
  { name: "January", numberOfDays: 31, mm: "01" },
  { name: "February", numberOfDays: 28, mm: "02" },
  { name: "March", numberOfDays: 31, mm: "03" },
  { name: "April", numberOfDays: 30, mm: "04" },
  { name: "May", numberOfDays: 31, mm: "05" },
  { name: "June", numberOfDays: 30, mm: "06" },
  { name: "July", numberOfDays: 31, mm: "07" },
  { name: "August", numberOfDays: 31, mm: "08" },
  { name: "September", numberOfDays: 30, mm: "09" },
  { name: "October", numberOfDays: 31, mm: "10" },
  { name: "November", numberOfDays: 30, mm: "11" },
  { name: "December", numberOfDays: 31, mm: "12" }
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

function render(calendarPage, logEntries) {
  var selectedMonth = months[calendarPage.month];

  elTitleText.innerText = `${selectedMonth.name} ${calendarPage.year}`;
  elTitleText.dataset.year = calendarPage.year;
  elTitleText.dataset.month = selectedMonth.mm;

  window.history.pushState(
    { calendarPage },
    "calendarPage",
    `#${calendarPage.year}/${(calendarPage.month).toString().padStart(2, '0')}`
  );

  elScoreboard.innerHTML = createScoreboardMarkup(logEntries);
  let outputMarkup = "";

  for (var day = 1; day <= selectedMonth.numberOfDays; day++) {
    var currentDate = new Date(calendarPage.year, calendarPage.month - 1, day, 12);
    outputMarkup += createCalendarDateMarkup(currentDate, logEntries)
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
    var yyyy = parseInt(yyyyMM.slice(0, 4));
    var mm = parseInt(yyyyMM.slice(-2));
    selectedDate = new Date(yyyy, (mm - 1), 15);
  }

  var calendarPage = {
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1
  };

  var logEntries = await fetchData(calendarPage);

  render(calendarPage, logEntries);
});

async function fetchData(calendarPage) {
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

  var yyyyMM = `${calendarPage.year}-${(calendarPage.month).toString().padStart(2, "0")}`;
  var logEntries = data.log.filter(entry => entry.date.startsWith(yyyyMM));

  return logEntries;
}

elPrevMonth.addEventListener("click", async e => await loadMonth(-1));
elNextMonth.addEventListener("click", async e => await loadMonth(1));

async function loadMonth(step) {
  var year = parseInt(elTitleText.dataset.year);
  var month = parseInt(elTitleText.dataset.month) + step;
  var logEntries = await fetchData({ year, month });

  render({ year, month }, logEntries);
}

window.addEventListener("popstate", async e => {
  if (e.state) {
    var calendarPage = e.state.calendarPage;
    var logEntries = await fetchData(calendarPage);
    render(calendarPage, logEntries);
  }
});
