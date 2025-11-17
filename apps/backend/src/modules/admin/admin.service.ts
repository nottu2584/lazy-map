import { Injectable, Inject } from '@nestjs/common';
import {
  ListUsersUseCase,
  UpdateUserUseCase,
  SuspendUserUseCase,
  ReactivateUserUseCase,
  PromoteUserUseCase,
  DeleteUserUseCase,
  GetUserStatsUseCase,
  CheckAdminAccessUseCase,
  GetUserPermissionsUseCase,
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
    @Inject(GetUserStatsUseCase) private readonly getUserStatsUseCase: GetUserStatsUseCase,
    @Inject(CheckAdminAccessUseCase) private readonly checkAdminAccessUseCase: CheckAdminAccessUseCase,
    @Inject(GetUserPermissionsUseCase) private readonly getUserPermissionsUseCase: GetUserPermissionsUseCase
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
    const result = await this.checkAdminAccessUseCase.execute({ userId });
    return {
      hasAccess: result.hasAccess,
      role: result.role,
      permissions: result.permissions,
      error: result.error
    };
  }

  async getUserPermissions(userId: string) {
    return this.getUserPermissionsUseCase.execute({ userId });
  }
}