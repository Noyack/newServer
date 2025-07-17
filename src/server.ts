import app from './app';
import { config } from './config/index';


const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});