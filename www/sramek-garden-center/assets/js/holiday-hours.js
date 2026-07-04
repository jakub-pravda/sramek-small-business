// Holiday / special opening hours configuration
// Each entry will appear after the standard opening hours on the main page
// and automatically disappear once today's date is past the `until` date.
//
// Fields:
//   title  – heading text shown above the hours
//   lines  – array of opening hour lines (displayed as separate rows)
//   until  – last day the entry is shown (inclusive), format "YYYY-MM-DD"
//
// Example – uncomment and adjust to add a new entry:
// {
//   title: "Vánoční svátky 2026",
//   lines: [
//     "24. 12.: 8:00 - 11:00",
//     "25. - 26. 12.: Zavřeno",
//     "27. - 31. 12.: 8:00 - 14:00",
//     "1. 1. 2027: Zavřeno"
//   ],
//   until: "2027-01-01"
// }

const HOLIDAY_HOURS = [
  // Add entries here, e.g.:
  {
    title: "Den upálení mistra Jana Husa (6.7.)",
    lines: [
      "Zavřeno",
    ],
    until: "2026-07-06",
  },
];

document.addEventListener("DOMContentLoaded", function () {
  const block = document.getElementById("hours-block");
  if (!block) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  HOLIDAY_HOURS.forEach(function (entry) {
    const until = new Date(entry.until);
    until.setHours(23, 59, 59, 999);

    if (today > until) return;

    const heading = document.createElement("h6");
    heading.textContent = entry.title;
    block.appendChild(heading);

    const p = document.createElement("p");
    p.innerHTML = entry.lines.join("<br>") + "<br>";
    block.appendChild(p);
  });
});
