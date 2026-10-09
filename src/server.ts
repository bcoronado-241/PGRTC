import { createApp } from './app';
import { getEnv } from './config/env';

const { PORT } = getEnv();
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] PGRTC API listening on http://localhost:${PORT}`);
});
