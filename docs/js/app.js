"use strict";

var elTitle = document.getElementById("title");
var elScoreboard = document.getElementById("scoreboard");
var elCalendar = document.getElementById("calendar");

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
  var summary = data.activities.reduce((acc, curr) => {
    acc[curr.name] = {
      glyph: curr.icon.glyph,
      isQuantifiable: curr.settings.isQuantifiable,
      quantity: 0,
      unit: curr.settings.unit
    }

    return acc;
  }, {});

  data.log.forEach(log => summary[log.activity].quantity += log.quantity);

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

function createCalendarDateMarkup(date, data) {
  var dayOfWeek = date.getDay();
  var day = date.getDate();
  var isSabbath = dayOfWeek === 0;
  var dateAsIso = date.toISOString().substring(0, 10);

  // TODO: Move this so it's not done n times
  var icons = data.activities.reduce((acc, curr) => {
    if (!acc[curr.name]) {
      acc[curr.name] = {
        glyph: curr.icon.glyph
      }
    }
    return acc;
  }, {});

  var activities = data.log.reduce((acc, curr) => {
    if (dateAsIso === curr.date) {
      acc += icons[curr.activity].glyph;
    }

    return acc;
  }, "")

  return `
    <div>
      <div class="date">
        <b class="dayOfMonth ${isSabbath ? 'sabbath' : ''}">${day}</b>
        <small class="day ${isSabbath ? 'sabbath' : ''}">
          ${days[dayOfWeek]}
        </small>
        <span>${activities}</span>
      </div>
    </div>`;
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
}

window.addEventListener("load", async () => {
  var today = new Date();
  var month = {
    year: today.getFullYear(),
    month: today.getMonth()
  };

  var response = await fetch('data/db.json');
  var data = await response.json();

  render(month, data);
});
