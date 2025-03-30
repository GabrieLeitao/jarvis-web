export const parseNaturalDate = (input) => {
  const now = new Date();
  let date = new Date();

  // Handle "tomorrow", "today", "next Monday", etc.
  if (input.includes("tomorrow")) {
    date.setDate(now.getDate() + 1);
  } else if (input.includes("today")) {
    date = now;
  } else if (input.includes("next")) {
    const dayOfWeek = input.split("next ")[1].trim();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(dayOfWeek.toLowerCase());
    if (targetDay !== -1) {
      let diff = targetDay - now.getDay();
      if (diff <= 0) diff += 7;
      date.setDate(now.getDate() + diff);
    }
  }

  // Handle specific dates like "October 5th", "5th of October", etc.
  const dateMatch = input.match(/(\d{1,2})(st|nd|rd|th)? (of )?(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = new Date(`${dateMatch[4]} 1, ${now.getFullYear()}`).getMonth();
    date.setMonth(month);
    date.setDate(day);
  }

  // Handle times like "at 3 PM", "at 14:00", "at noon", etc.
  const timeMatch = input.match(/at (\d{1,2}(:\d{2})? (AM|PM)|\d{1,2}(:\d{2})?|noon|midnight)/i);
  if (timeMatch) {
    const timeString = timeMatch[1];
    if (timeString === "noon") {
      date.setHours(12, 0, 0);
    } else if (timeString === "midnight") {
      date.setHours(0, 0, 0);
    } else {
      const timeParts = timeString.split(/[: ]/);
      let hours = parseInt(timeParts[0], 10);
      let minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

      if (timeString.includes("PM") && hours < 12) hours += 12;
      if (timeString.includes("AM") && hours === 12) hours = 0;

      date.setHours(hours, minutes, 0);
    }
  }

  return date;
};
