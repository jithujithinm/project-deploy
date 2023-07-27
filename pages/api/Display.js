// pages/api/Display.js

import mysql from 'mysql';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kismat'
});

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { service, location } = req.body;

  const query = `SELECT * FROM image1 WHERE service = ? AND location = ?`;
  const params = [service, location];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Search query failed', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.status(200).json({ results });
    }
  });
}
