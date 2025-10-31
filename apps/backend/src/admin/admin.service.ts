import { Injectable, Inject } from '@nestjs/common';
import {
  ListUsersUseCase,
  UpdateUserUseCase,
  SuspendUserUseCase,
  ReactivateUserUseCase,
  PromoteUserUseCase,
  DeleteUserUseCase,
  GetUserStatsUseCase,
  ListUsersQuery,
  UpdateUserCommand,
  SuspendUserCommand,
  ReactivateUserCommand,
  PromoteUserCommand,
  DeleteUserCommand,
  GetUserStatsQuery
} from '@lazy-map/application';

@Injectable()
export class AdminService {
  constructor(
    @Inject(ListUsersUseCase) private readonly listUsersUseCase: ListUsersUseCase,
    @Inject(UpdateUserUseCase) private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(SuspendUserUseCase) private readonly suspendUserUseCase: SuspendUserUseCase,
    @Inject(ReactivateUserUseCase) private readonly reactivateUserUseCase: ReactivateUserUseCase,
    @Inject(PromoteUserUseCase) private readonly promoteUserUseCase: PromoteUserUseCase,
    @Inject(DeleteUserUseCase) private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject(GetUserStatsUseCase) private readonly getUserStatsUseCase: GetUserStatsUseCase
  ) {}

  async listUsers(query: ListUsersQuery) {
    return this.listUsersUseCase.execute(query);
  }

  async updateUser(command: UpdateUserCommand) {
    return this.updateUserUseCase.execute(command);
  }

  async suspendUser(command: SuspendUserCommand) {
    return this.suspendUserUseCase.execute(command);
  }

  async reactivateUser(command: ReactivateUserCommand) {
    return this.reactivateUserUseCase.execute(command);
  }

  async promoteUser(command: PromoteUserCommand) {
    return this.promoteUserUseCase.execute(command);
  }

  async deleteUser(command: DeleteUserCommand) {
    return this.deleteUserUseCase.execute(command);
  }

  async getUserStats(query: GetUserStatsQuery) {
    return this.getUserStatsUseCase.execute(query);
  }

  async checkAdminAccess(userId: string) {
    // This would need to be implemented as a separate use case or through the repository
    // For now, we'll need to check the user's role directly
    // This is a placeholder - you may want to create a CheckAdminAccessUseCase
    return { hasAccess: false, error: 'Not implemented' };
  }

  async checkSuperAdminAccess(userId: string) {
    // This would need to be implemented as a separate use case or through the repository
    // For now, we'll need to check the user's role directly
    // This is a placeholder - you may want to create a CheckSuperAdminAccessUseCase
    return { hasAccess: false, error: 'Not implemented' };
  }

  async checkDeleteAccess(userId: string) {
    // This would need to be implemented as a separate use case or through the repository
    // For now, we'll need to check the user's role directly
    // This is a placeholder - you may want to create a CheckDeleteAccessUseCase
    return { hasAccess: false, error: 'Not implemented' };
  }
}