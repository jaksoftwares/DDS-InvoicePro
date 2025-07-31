import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const users: { [email: string]: { name: string; email: string; password: string } } = {};
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; name: string };
    const user = users[decoded.email];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user: { name: user.name, email: user.email } });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
