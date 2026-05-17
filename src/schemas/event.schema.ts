import { z } from 'zod';
import { predefinedEventTags } from '../constants/eventTags';

const predefinedEventTagSchema = z.enum(predefinedEventTags);

export const eventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  dateTime: z.string().min(1, 'Date and time are required'),
  location: z.string().min(2),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  tags: z.array(predefinedEventTagSchema).optional().default([]),
});

export type EventInput = z.infer<typeof eventSchema>;
