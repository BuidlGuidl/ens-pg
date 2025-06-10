const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getFormattedDate(date: Date) {
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString();

  return `${month} ${year}`;
}

export function getFormattedDateWithDay(date: Date) {
  const dateFormatted = getFormattedDate(date);

  const day = date.getDate().toString();

  return `${day} ${dateFormatted}`;
}

export function getFormattedDeadline(date: Date) {
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear().toString();
  const day = date.getUTCDate().toString();

  return `${day} ${month} ${year}`;
}
