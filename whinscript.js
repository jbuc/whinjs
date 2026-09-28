"use strict";

const raw = String(kmvar.snippetValue || "").trim();

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_TIME_FORMAT = "YYYY-MM-DD HH:mm";
const DEFAULT_SECOND_FORMAT = "YYYY-MM-DD HH:mm:ss";

const WEEKDAYS = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6
};

const clone = d => new Date(d.getTime());

const makeDate = (source, year, month, day) =>
  new Date(
    year,
    month,
    day,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );

const daysInMonth = (year, month) =>
  new Date(year, month + 1, 0, 12).getDate();

const isBusinessDay = d => {
  const day = d.getDay();
  return day >= 1 && day <= 5;
};

const addCalendarDays = (d, n) => {
  const out = clone(d);
  out.setDate(out.getDate() + n);
  return out;
};

const addCalendarWeeks = (d, n) =>
  addCalendarDays(d, n * 7);

const closestBusinessDay = (d, direction = 1) => {
  const out = clone(d);
  const step = direction < 0 ? -1 : 1;

  while (!isBusinessDay(out)) {
    out.setDate(out.getDate() + step);
  }

  return out;
};

const closestWeekday = (d, weekday, direction = 1) => {
  const out = clone(d);
  const current = out.getDay();

  const offset =
    direction < 0
      ? -((current - weekday + 7) % 7)
      : (weekday - current + 7) % 7;

  out.setDate(out.getDate() + offset);
  return out;
};

const addBusinessDays = (d, n) => {
  if (n === 0) return clone(d);

  const out = clone(d);
  const step = n < 0 ? -1 : 1;
  let remaining = Math.abs(n);

  while (remaining > 0) {
    out.setDate(out.getDate() + step);

    if (isBusinessDay(out)) {
      remaining--;
    }
  }

  return out;
};

const ordinalWeekday = d => ({
  weekday: d.getDay(),
  ordinal: Math.floor((d.getDate() - 1) / 7) + 1
});

const nthWeekdayOfMonth = (
  source,
  year,
  month,
  weekday,
  ordinal
) => {
  const first = makeDate(source, year, month, 1);

  const firstOffset =
    (weekday - first.getDay() + 7) % 7;

  let day =
    1 +
    firstOffset +
    (ordinal - 1) * 7;

  const max = daysInMonth(year, month);

  // If this month does not contain a 5th occurrence,
  // use the final occurrence of that weekday instead.
  if (day > max) {
    const last = makeDate(source, year, month, max);

    day =
      max -
      ((last.getDay() - weekday + 7) % 7);
  }

  return makeDate(source, year, month, day);
};

const shiftStructuralMonths = (d, n) => {
  const { weekday, ordinal } = ordinalWeekday(d);

  const totalMonths =
    d.getFullYear() * 12 +
    d.getMonth() +
    n;

  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;

  return nthWeekdayOfMonth(
    d,
    year,
    month,
    weekday,
    ordinal
  );
};

const shiftCalendarMonths = (d, n) => {
  const totalMonths =
    d.getFullYear() * 12 +
    d.getMonth() +
    n;

  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;

  const day = Math.min(
    d.getDate(),
    daysInMonth(year, month)
  );

  return makeDate(d, year, month, day);
};

const startOfWeek = d => {
  const out = clone(d);
  out.setDate(out.getDate() - out.getDay());
  return out;
};

const startOfMonth = d =>
  makeDate(d, d.getFullYear(), d.getMonth(), 1);

const endOfMonth = d =>
  makeDate(
    d,
    d.getFullYear(),
    d.getMonth(),
    daysInMonth(d.getFullYear(), d.getMonth())
  );

const startOfQuarter = d => {
  const month = Math.floor(d.getMonth() / 3) * 3;

  return makeDate(
    d,
    d.getFullYear(),
    month,
    1
  );
};

const endOfQuarter = d => {
  const month =
    Math.floor(d.getMonth() / 3) * 3 + 2;

  return makeDate(
    d,
    d.getFullYear(),
    month,
    daysInMonth(d.getFullYear(), month)
  );
};

const startOfYear = d =>
  makeDate(d, d.getFullYear(), 0, 1);

const endOfYear = d =>
  makeDate(d, d.getFullYear(), 11, 31);

const randomDateBetween = (
  start,
  end,
  businessOnly,
  source
) => {
  let a = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    12
  );

  let b = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    12
  );

  if (a > b) {
    [a, b] = [b, a];
  }

  const candidates = [];

  for (
    let d = clone(a);
    d <= b;
    d.setDate(d.getDate() + 1)
  ) {
    if (!businessOnly || isBusinessDay(d)) {
      candidates.push(clone(d));
    }
  }

  if (!candidates.length) return null;

  const out =
    candidates[
      Math.floor(Math.random() * candidates.length)
    ];

  out.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );

  return out;
};

const formatDate = (d, format) => {
  const shortDays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  const longDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const pad = (n, width = 2) =>
    String(n).padStart(width, "0");

  const tokens = {
    YYYY: String(d.getFullYear()),
    YY: pad(d.getFullYear() % 100),

    MM: pad(d.getMonth() + 1),
    M: String(d.getMonth() + 1),

    DD: pad(d.getDate()),
    D: String(d.getDate()),

    dddd: longDays[d.getDay()],
    ddd: shortDays[d.getDay()],

    HH: pad(d.getHours()),
    H: String(d.getHours()),

    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  };

  return format.replace(
    /YYYY|dddd|ddd|YY|MM|DD|HH|mm|ss|M|D|H/g,
    token => tokens[token]
  );
};

function calculate(input, now = new Date()) {
  let expr = input.trim();

  if (expr.startsWith("@@")) {
    expr = expr.slice(2);
  }

  if (expr.endsWith("@@")) {
    expr = expr.slice(0, -2);
  }

  expr = expr.trim();

  // Explicit /format overrides all automatic formatting.
  let format = null;

  const slash = expr.indexOf("/");

  if (slash >= 0) {
    format = expr.slice(slash + 1) || null;
    expr = expr.slice(0, slash);
  }

  expr = expr.toLowerCase();

  const keywords = {
    today: 0,
    tomorrow: 1,
    yesterday: -1
  };

  if (
    Object.prototype.hasOwnProperty.call(
      keywords,
      expr
    )
  ) {
    return formatDate(
      addCalendarDays(now, keywords[expr]),
      format || DEFAULT_DATE_FORMAT
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      WEEKDAYS,
      expr
    )
  ) {
    return formatDate(
      closestWeekday(
        now,
        WEEKDAYS[expr],
        1
      ),
      format || DEFAULT_DATE_FORMAT
    );
  }

  const match = expr.match(
    /^([+-]?\d+)?(c)?(min|s|h|d|w|m|q|y)(?:-(r|sun|mon|tue|wed|thu|fri|sat))?$/
  );

  if (!match) return null;

  const amount =
    match[1] === undefined
      ? 0
      : Number(match[1]);

  const calendar = Boolean(match[2]);
  const unit = match[3];
  const modifier = match[4] || null;

  // Choose the default output format only after
  // we know what kind of calculation this is.
  if (!format) {
    if (unit === "s") {
      format = DEFAULT_SECOND_FORMAT;
    } else if (
      unit === "min" ||
      unit === "h"
    ) {
      format = DEFAULT_TIME_FORMAT;
    } else {
      format = DEFAULT_DATE_FORMAT;
    }
  }

  const random = modifier === "r";

  const explicitWeekday =
    modifier && modifier !== "r"
      ? WEEKDAYS[modifier]
      : null;

  const direction = amount < 0 ? -1 : 1;

  if (
    random &&
    ["s", "min", "h", "d"].includes(unit)
  ) {
    return null;
  }

  // ─────────────────────────────
  // Time calculations
  // ─────────────────────────────

  if (unit === "s") {
    return formatDate(
      new Date(
        now.getTime() +
        amount * 1000
      ),
      format
    );
  }

  if (unit === "min") {
    return formatDate(
      new Date(
        now.getTime() +
        amount * 60 * 1000
      ),
      format
    );
  }

  if (unit === "h") {
    return formatDate(
      new Date(
        now.getTime() +
        amount * 60 * 60 * 1000
      ),
      format
    );
  }

  // ─────────────────────────────
  // Day calculations
  // ─────────────────────────────

  if (unit === "d") {
    let result;

    if (explicitWeekday !== null) {
      const anchor = closestWeekday(
        now,
        explicitWeekday,
        direction
      );

      result = addCalendarDays(
        anchor,
        amount
      );

    } else if (calendar) {
      result = addCalendarDays(
        now,
        amount
      );

    } else if (amount === 0) {
      // @@d = today
      result = clone(now);

    } else {
      // @@1d = next business day
      result = addBusinessDays(
        now,
        amount
      );
    }

    return formatDate(
      result,
      format
    );
  }

  // ─────────────────────────────
  // Random period calculations
  // ─────────────────────────────

  if (random) {
    let target;

    if (unit === "w") {
      const anchor =
        calendar
          ? clone(now)
          : closestBusinessDay(
              now,
              direction
            );

      target = addCalendarWeeks(
        anchor,
        amount
      );

    } else if (unit === "m") {
      target =
        calendar
          ? shiftCalendarMonths(
              now,
              amount
            )
          : shiftStructuralMonths(
              closestBusinessDay(
                now,
                direction
              ),
              amount
            );

    } else if (unit === "q") {
      target =
        calendar
          ? shiftCalendarMonths(
              now,
              amount * 3
            )
          : shiftStructuralMonths(
              closestBusinessDay(
                now,
                direction
              ),
              amount * 3
            );

    } else if (unit === "y") {
      target =
        calendar
          ? shiftCalendarMonths(
              now,
              amount * 12
            )
          : shiftStructuralMonths(
              closestBusinessDay(
                now,
                direction
              ),
              amount * 12
            );
    }

    let start;
    let end;

    if (unit === "w") {
      start = startOfWeek(target);
      end = addCalendarDays(start, 6);

    } else if (unit === "m") {
      start = startOfMonth(target);
      end = endOfMonth(target);

    } else if (unit === "q") {
      start = startOfQuarter(target);
      end = endOfQuarter(target);

    } else if (unit === "y") {
      start = startOfYear(target);
      end = endOfYear(target);
    }

    const result = randomDateBetween(
      start,
      end,
      !calendar,
      now
    );

    return result
      ? formatDate(result, format)
      : null;
  }

  // ─────────────────────────────
  // Structural anchor
  // ─────────────────────────────

  let anchor;

  if (explicitWeekday !== null) {
    // Explicit weekday becomes the anchor.
    anchor = closestWeekday(
      now,
      explicitWeekday,
      direction
    );

  } else if (calendar) {
    // Calendar calculations use the literal date.
    anchor = clone(now);

  } else {
    // Default structural calculations begin from
    // the closest business day in the direction
    // of travel.
    anchor = closestBusinessDay(
      now,
      direction
    );
  }

  // ─────────────────────────────
  // Structural calculation
  // ─────────────────────────────

  let result;

  if (unit === "w") {
    result = addCalendarWeeks(
      anchor,
      amount
    );

  } else if (unit === "m") {
    result =
      calendar
        ? shiftCalendarMonths(
            anchor,
            amount
          )
        : shiftStructuralMonths(
            anchor,
            amount
          );

  } else if (unit === "q") {
    result =
      calendar
        ? shiftCalendarMonths(
            anchor,
            amount * 3
          )
        : shiftStructuralMonths(
            anchor,
            amount * 3
          );

  } else if (unit === "y") {
    result =
      calendar
        ? shiftCalendarMonths(
            anchor,
            amount * 12
          )
        : shiftStructuralMonths(
            anchor,
            amount * 12
          );
  }

  // Explicit weekdays may intentionally land on
  // weekends. Calendar mode also bypasses the
  // normal Mon-Fri filter.
  if (
    explicitWeekday === null &&
    !calendar &&
    !isBusinessDay(result)
  ) {
    result = closestBusinessDay(
      result,
      direction
    );
  }

  return formatDate(
    result,
    format
  );
}

const result = calculate(raw);

// Fail safely by restoring the expression
// if it was not understood.
if (result === null) {
  return raw + " ";
}

return result + " ";