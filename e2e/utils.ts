// Helper function to create activity title with timestamp
export function createTimestampTitle(baseTitle: string) {
  const now = new Date();
  const datePart = now.toLocaleDateString().replace(/\//g, "");
  const timePart = now
    .toLocaleTimeString("en-US", { hour12: false })
    .replace(/:/g, "")
    .substring(0, 4);
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${baseTitle}-${datePart}${timePart}-${randomDigits}`;
}

// Helper function to generate a random Chinese mobile phone number
export function generateRandomPhoneNumber() {
  // Chinese mobile phone number prefixes
  const prefixes = [
    "130",
    "131",
    "132",
    "133",
    "134",
    "135",
    "136",
    "137",
    "138",
    "139",
    "150",
    "151",
    "152",
    "153",
    "155",
    "156",
    "157",
    "158",
    "159",
    "170",
    "176",
    "177",
    "178",
    "180",
    "181",
    "182",
    "183",
    "184",
    "185",
    "186",
    "187",
    "188",
    "189",
  ];

  // Randomly select a prefix
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generate 8 random digits for the rest of the number
  const remainingDigits = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");

  return `${prefix}${remainingDigits}`;
}
