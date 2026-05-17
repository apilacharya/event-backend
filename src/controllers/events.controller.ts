import { EventType, Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { predefinedEventTags } from '../constants/eventTags';
import prisma from '../prisma';
import { EventInput } from '../schemas/event.schema';

interface HttpError extends Error {
  status?: number;
}

const eventInclude = Prisma.validator<Prisma.EventInclude>()({
  creator: { select: { name: true } },
  tags: { include: { tag: true } },
});

type EventWithRelations = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function formatEvent(event: EventWithRelations) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    dateTime: event.dateTime,
    location: event.location,
    type: event.type,
    creatorId: event.creatorId,
    creatorName: event.creator.name,
    tags: event.tags.map((eventTag) => eventTag.tag.name),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function createError(message: string, status: number): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

function normalizeTags(tags: string[] | undefined): string[] {
  const allowedTagSet = new Set(predefinedEventTags);
  const normalized = (tags ?? [])
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag) && allowedTagSet.has(tag as (typeof predefinedEventTags)[number]));
  return [...new Set(normalized)];
}

async function buildTagConnections(tagNames: string[]): Promise<Array<{ tagId: number }>> {
  const result: Array<{ tagId: number }> = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    result.push({ tagId: tag.id });
  }
  return result;
}

export const EventsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, tags, upcoming } = req.query as Record<string, string | undefined>;
      const where: Prisma.EventWhereInput = {};

      if (type === 'PUBLIC' || type === 'PRIVATE') {
        where.type = type as EventType;
      }

      if (upcoming === 'true') {
        where.dateTime = { gte: new Date() };
      }
      if (upcoming === 'false') {
        where.dateTime = { lt: new Date() };
      }

      if (tags) {
        const tagList = tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(
            (tag): tag is string =>
              Boolean(tag) && predefinedEventTags.includes(tag as (typeof predefinedEventTags)[number]),
          );
        if (tagList.length > 0) {
          where.tags = { some: { tag: { name: { in: tagList } } } };
        }
      }

      const events = await prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { dateTime: 'desc' },
      });

      res.json(events.map(formatEvent));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: Number(req.params.id) },
        include: eventInclude,
      });

      if (!event) {
        res.status(404).json({ message: 'Event not found', errors: {} });
        return;
      }

      res.json(formatEvent(event));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, dateTime, location, type, tags } = req.body as EventInput;
      const parsedDate = new Date(dateTime);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ message: 'Invalid event date', errors: {} });
        return;
      }
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDateOnly = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      if (eventDateOnly < startOfToday) {
        res.status(400).json({ message: 'Event date cannot be in the past', errors: {} });
        return;
      }
      const normalizedTags = normalizeTags(tags);
      const tagConnections = await buildTagConnections(normalizedTags);

      const event = await prisma.event.create({
        data: {
          title,
          description,
          dateTime: parsedDate,
          location,
          type: type as EventType,
          creatorId: req.user!.id,
          tags: { create: tagConnections },
        },
        include: eventInclude,
      });

      res.status(201).json(formatEvent(event));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.event.findUnique({ where: { id } });

      if (!existing) {
        res.status(404).json({ message: 'Event not found', errors: {} });
        return;
      }

      if (existing.creatorId !== req.user!.id) {
        next(createError('Forbidden', 403));
        return;
      }

      const { title, description, dateTime, location, type, tags } = req.body as EventInput;
      const parsedDate = new Date(dateTime);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ message: 'Invalid event date', errors: {} });
        return;
      }
      const normalizedTags = normalizeTags(tags);
      const tagConnections = await buildTagConnections(normalizedTags);

      await prisma.eventTag.deleteMany({ where: { eventId: id } });

      const event = await prisma.event.update({
        where: { id },
        data: {
          title,
          description,
          dateTime: parsedDate,
          location,
          type: type as EventType,
          tags: { create: tagConnections },
        },
        include: eventInclude,
      });

      res.json(formatEvent(event));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.event.findUnique({ where: { id } });

      if (!existing) {
        res.status(404).json({ message: 'Event not found', errors: {} });
        return;
      }

      if (existing.creatorId !== req.user!.id) {
        next(createError('Forbidden', 403));
        return;
      }

      await prisma.event.delete({ where: { id } });
      res.json({ message: 'Event deleted' });
    } catch (err) {
      next(err);
    }
  },
};
