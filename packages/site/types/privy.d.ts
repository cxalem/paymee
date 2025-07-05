declare module "@privy-io/server-auth" {
  export interface AuthTokenClaims {
    appId: string;
    userId: string;
    issuer: string;
    issuedAt: string;
    expiration: string;
    sessionId: string;
  }

  export class PrivyClient {
    constructor(appId: string, appSecret: string);
    verifyAuthToken(token: string, verificationKey?: string): Promise<AuthTokenClaims>;
  }
} 