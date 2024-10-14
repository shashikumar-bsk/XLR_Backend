import express from 'express';
import cors from 'cors';
import http from 'http';
import dbInit from './db/init';
import routes from './routes';
import { initializeSocket,socketHandlers } from './socket/socket';
import { initializeSocketDriver, socketHandlersDriver } from './socket/driverSocket'

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
const ioDriver = initializeSocketDriver(server);

const port = 3000;

app.use(express.json());
app.use(cors({
  "origin": "*"
})); // Enable cors for all origins

// Database initialization
dbInit();


// Initializing routes
app.use('/api/v1', routes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

socketHandlers(io)
socketHandlersDriver(ioDriver);

server.listen(port, () => {
  console.log(`Express is listening at ${port}`);
});

