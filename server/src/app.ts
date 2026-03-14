import express from 'express';
import http from 'http';
import dotenv from 'dotenv';

import configManager from './services/configManager';
import socketService from './services/socketManager';
import accountManager from './services/accountManager';
import gameLevelManager from './scripts/gameLevelManager';
import logger from './utils/logger';

configManager.loadConfig();
dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);

socketService.init(server);
accountManager.init();

gameLevelManager.init();

server.listen(configManager.port, () => {
    logger.info(`服务器运行在端口 ${configManager.port}`);
});
