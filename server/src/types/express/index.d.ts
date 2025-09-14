
namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      name?: string;
      username?: string;
      role?: string;
      [key: string]: any;
    };
  }
}