import { getUserCount } from '../models/userModel.js';

export async function getUserCountHandler(req, res) {
  try {
    const count = await getUserCount();
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user count' });
  }
}
