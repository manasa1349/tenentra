import app from './app.js';
import { env } from './config/env.js';

const PORT = env.server.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});