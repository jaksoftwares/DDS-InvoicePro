import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users: { [email: string]: { name: string; email: string; password: string } } = {};
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const user = users[email];
  if (!user) return res.status(404).json({ message: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ token });
}
