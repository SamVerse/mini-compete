import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as Redis from 'ioredis';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private redisClient: Redis.Redis;

  constructor() {
    this.redisClient = new Redis.Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Check for header and method
    const idempotencyKey = req.header('Idempotency-Key');
    if (req.method !== 'POST' || !idempotencyKey) {
      return next();
    }

    const key = `idempotency:${idempotencyKey}`;
    const resultKey = `result:${idempotencyKey}`;
    const timeout = 60 * 60; // 1 hour expiration for keys

    // 2. Check if the request has already been processed and a result saved
    const storedResult = await this.redisClient.get(resultKey);
    if (storedResult) {
      const { status, body } = JSON.parse(storedResult);
      return res.status(status).json(body);
    }

    // 3. Attempt to lock the key (SETNX = SET if Not eXists)
    const isNew = await this.redisClient.set(key, 'processing', 'EX', timeout, 'NX');

    if (isNew) {
      // New request: Proceed, but wrap the response sending
      const originalJson = res.json;
      res.json = (body) => {
        // After successful execution, save the result before sending
        this.redisClient.set(resultKey, JSON.stringify({ 
            status: res.statusCode, 
            body 
        }), 'EX', timeout);

        // Cleanup the temporary lock key
        this.redisClient.del(key); 

        return originalJson.call(res, body);
      };

      return next();
    } else {
      // Key exists: The request is either processing or failed/retrying
      const status = await this.redisClient.get(key);
      if (status === 'processing') {
        // Request is already running concurrently
        return res.status(HttpStatus.CONFLICT).json({ message: 'Request is already processing.' });
      } else {
        // For simplicity, treat other cases (e.g., race conditions) as a conflict
        return res.status(HttpStatus.CONFLICT).json({ message: 'Duplicate request.' });
      }
    }
  }
}