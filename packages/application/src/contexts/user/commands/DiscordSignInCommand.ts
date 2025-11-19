/**
 * Command for Discord Sign-In authentication
 */
export class DiscordSignInCommand {
  constructor(
    public readonly accessToken: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
