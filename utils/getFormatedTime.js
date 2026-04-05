export function getFormatedTime(dateTimeString) {
  if (!dateTimeString) return '';
  const dateTime = new Date(dateTimeString);

  // Get the date in the desired format
  const date = dateTime.toISOString().split("T")[0];

  // Get the time in the desired format
  const hours = dateTime.getHours().toString().padStart(2, '0');
  const minutes = dateTime.getMinutes().toString().padStart(2, '0');
  const ampm = dateTime.getHours() >= 12 ? 'PM' : 'AM';
  const formattedTime = `${hours}:${minutes}${ampm}`;

  // Concatenate time and date with a space in between
  const formattedDateTime = `${formattedTime} ${date}`;

  return formattedDateTime;
}