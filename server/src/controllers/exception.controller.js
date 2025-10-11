import { listExceptions, decideException } from '../services/exception.service.js';

export const list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const exceptions = await listExceptions(status);
    res.json(exceptions);
  } catch (error) {
    next(error);
  }
};

export const decide = async (req, res, next) => {
  try {
    const { decision, comment } = req.body;
    const exception = await decideException(
      req.params.id, 
      decision, 
      comment,
      req.user.sub
    );
    res.json(exception);
  } catch (error) {
    next(error);
  }
};
