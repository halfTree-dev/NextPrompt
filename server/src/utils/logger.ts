import winston from 'winston';
import util from 'util';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.splat(),
        winston.format.printf(info => {
            const splat = info[Symbol.for('splat') as any] as any[];
            let meta = '';
            if (splat && splat.length) {
                meta = splat.map((obj: any) => {
                    return util.inspect(obj, { colors: true, depth: null });
                }).join(' ');
            }
            return `${info.timestamp} [${info.level}]: ${info.message} ${meta}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export default logger;
