import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users: { [email: string]: { name: string; email: string; password: string } } = {};
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (users[email]) return res.status(409).json({ message: 'User already exists' });
  const hashed = await bcrypt.hash(password, 10);
  users[email] = { name, email, password: hashed };
  const token = jwt.sign({ email, name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token });
}
