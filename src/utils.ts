// utils.ts

export const getDaySuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th"; // Catch 11th-13th
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export const formatDateTime = (
  date: Date
): {
  formattedDate: string;
  formattedTime: string;
} => {
  const day = date.getUTCDate();
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const year = date.getUTCFullYear();
  const formattedHours = String(date.getUTCHours()).padStart(2, "0");
  const formattedMinutes = String(date.getUTCMinutes()).padStart(2, "0");

  const daySuffix = getDaySuffix(day);
  const formattedDate = `${day}${daySuffix} ${month} ${year}`;
  const formattedTime = `${formattedHours}:${formattedMinutes} UTC`;

  return { formattedDate, formattedTime };
};

export const parseDuration = (
  durationStr: string
): { days: number; hours: number; minutes: number } | null => {
  // Normalize input to lowercase
  const timeUntilInput = durationStr.toLowerCase();

  // Regex to find all duration components (e.g., '2d', '4h', '33m')
  const durationComponents = timeUntilInput.match(/(\d+\s*[dhm])/g);

  if (!durationComponents) {
    return null; // No duration components found
  }

  let days = 0,
    hours = 0,
    minutes = 0;

  for (const component of durationComponents) {
    const valueMatch = component.match(/\d+/);
    if (!valueMatch) continue; // Skip if no digits found
    const value = parseInt(valueMatch[0], 10);
    if (component.includes("d")) {
      days += value;
    } else if (component.includes("h")) {
      hours += value;
    } else if (component.includes("m")) {
      minutes += value;
    }
  }

  return { days, hours, minutes };
};

export const validMoonTypes = ["lava", "ice"];

// Updated systemRegex to allow spaces
export const systemRegex = /^[A-Za-z0-9\- ]+$/;

export const validateSystem = (system: string): boolean => {
  // Trim the system name to remove leading/trailing spaces
  const trimmedSystem = system.trim();

  // Ensure system name is not empty after trimming
  if (trimmedSystem.length === 0) {
    return false;
  }

  // Check if the length exceeds 10 characters
  if (trimmedSystem.length > 20) {
    return false;
  }

  // Validate the trimmed system name
  return systemRegex.test(trimmedSystem);
};

export const parseMoonType = (moonType: string): "Lava" | "Ice" | null => {
  const normalized = moonType.trim().toLowerCase();
  if (normalized === "lava" || normalized === "l") {
    return "Lava";
  } else if (normalized === "ice" || normalized === "i") {
    return "Ice";
  } else {
    return null;
  }
};
