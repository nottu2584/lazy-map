/**
 * Command for checking admin access
 */
export class CheckAdminAccessCommand {
  constructor(public readonly userId: string) {}
}