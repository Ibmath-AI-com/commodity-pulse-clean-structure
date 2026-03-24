// E:\AI Projects\commodity-clean-structure\src\entities\models\cookie.ts
export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
};

export type Cookie = {
  name: string;
  value: string;
  options: CookieOptions;
};