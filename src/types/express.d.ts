import { Express } from 'express-serve-static-core';
import * as multer from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: multer.File;
      files?:
        | {
            [fieldname: string]: multer.File[];
          }
        | multer.File[];
      cookies: {
        [key: string]: string;
      };
      user: {
        id: number;
        username: string;
      };
    }
  }
}
