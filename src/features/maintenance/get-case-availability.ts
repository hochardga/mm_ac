export function getCaseAvailability(input: {
  currentPublishedRevision: string;
  hasStartedCase: boolean;
}) {
  const published = input.currentPublishedRevision.length > 0;

  return {
    published,
    visible: published || input.hasStartedCase,
  };
}
