const calculateBoundaries = (
  dateString?: string,
): { sundayBoundary: string; saturdayBoundary: string } => {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();

  const latestSunday = new Date(date);
  latestSunday.setDate(date.getDate() - date.getDay());
  latestSunday.setHours(0, 0, 0, 0);
  const sundayBoundary = latestSunday.toISOString();

  const nextSaturday = new Date(date);
  nextSaturday.setDate(date.getDate() + (6 - date.getDay()));
  nextSaturday.setHours(23, 59, 59, 999);
  const saturdayBoundary = nextSaturday.toISOString();

  return { sundayBoundary, saturdayBoundary };
};

export default calculateBoundaries;
