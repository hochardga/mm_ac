export function getCaseAvailability(input: {
  published: boolean;
  broken: boolean;
  hasPlayerCase: boolean;
}) {
  if (!input.published) {
    return input.hasPlayerCase ? "Available" : "Hidden";
  }

  if (input.broken && !input.hasPlayerCase) {
    return "Maintenance";
  }

  return "Available";
}
