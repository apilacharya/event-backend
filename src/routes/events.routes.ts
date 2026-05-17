import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { eventSchema } from '../schemas/event.schema';

const router = Router();

router.get('/', EventsController.list);
router.get('/:id', EventsController.getOne);
router.post('/', requireAuth, validate(eventSchema), EventsController.create);
router.put('/:id', requireAuth, validate(eventSchema), EventsController.update);
router.delete('/:id', requireAuth, EventsController.remove);

export default router;
