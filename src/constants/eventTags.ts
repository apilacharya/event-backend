export const predefinedEventTags = [
  'birthday',
  'conference',
  'workshop',
  'meetup',
  'seminar',
  'webinar',
  'networking',
  'festival',
  'party',
  'wedding',
  'fundraiser',
  'community',
] as const;

export type PredefinedEventTag = (typeof predefinedEventTags)[number];
