    import { validateAndPunch, getUserPunches } from '../services/punch.service.js';

export const postPunch = async (req, res, next) => {
  try {
    const punch = await validateAndPunch(req.user, req.body, req);
    res.status(201).json(punch);
  } catch (error) {
    next(error);
  }
};

export const getMyPunches = async (req, res, next) => {
  try {
    const punches = await getUserPunches(req.user.sub, req.query);
    res.json(punches);
  } catch (error) {
    next(error);
  }
};
