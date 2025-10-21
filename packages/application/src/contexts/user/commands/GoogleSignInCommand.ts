/**
 * Command for Google Sign-In authentication
 */
export class GoogleSignInCommand {
  constructor(
    public readonly idToken: string,
    public readonly clientId?: string
  ) {}
}