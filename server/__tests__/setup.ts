import path from 'path';

// Point to the actual built engine binary
process.env.ENGINE_PATH = path.resolve(__dirname, '../../build/engine/orderbook_server.exe');
