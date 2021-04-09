export const age = (dateOfBirth: Date | string, atDate: Date | string = new Date()): number => {
  if (typeof dateOfBirth === "string") {
    dateOfBirth = new Date(dateOfBirth);
  }

  if (typeof atDate === "string") {
    atDate = new Date(atDate);
  }

  // Calculate month difference from current date in time
  // Convert the calculated difference in date format
  const ageDate = new Date(atDate.getTime() - dateOfBirth.getTime());

  // Extract year from date
  const year = ageDate.getUTCFullYear();

  // Now calculate the age of the user
  return Math.abs(year - 1970);
};
