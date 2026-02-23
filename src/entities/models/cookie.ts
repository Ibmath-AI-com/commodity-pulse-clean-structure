// E:\AI Projects\commodity-clean-structure\src\entities\models\cookie.ts
//type CookieAttributes = {
//  secure?: boolean;
//  path?: string;
//  domain?: string;
//  sameSite?: 'lax' | 'strict' | 'none';
//  httpOnly?: boolean;
//  maxAge?: number;
//  expires?: Date;
//};

export type Cookie = {
  name: string;
  value: string;
  attributes: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
    expires?: Date;
    domain?: string;
  };
};
