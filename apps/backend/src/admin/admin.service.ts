import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '@lazy-map/domain';
import {
  UserAdministrationService,
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
  private readonly userAdministrationService: UserAdministrationService;

  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {
    this.userAdministrationService = new UserAdministrationService(userRepository);
  }

  async listUsers(query: ListUsersQuery) {
    return this.userAdministrationService.listUsers(query);
  }

  async updateUser(command: UpdateUserCommand) {
    return this.userAdministrationService.updateUser(command);
  }

  async suspendUser(command: SuspendUserCommand) {
    return this.userAdministrationService.suspendUser(command);
  }

  async reactivateUser(command: ReactivateUserCommand) {
    return this.userAdministrationService.reactivateUser(command);
  }

  async promoteUser(command: PromoteUserCommand) {
    return this.userAdministrationService.promoteUser(command);
  }

  async deleteUser(command: DeleteUserCommand) {
    return this.userAdministrationService.deleteUser(command);
  }

  async getUserStats(query: GetUserStatsQuery) {
    return this.userAdministrationService.getUserStats(query);
  }

  async checkAdminAccess(userId: string) {
    return this.userAdministrationService.checkAdminAccess({ userId });
  }

  async checkSuperAdminAccess(userId: string) {
    return this.userAdministrationService.checkSuperAdminAccess({ userId });
  }

  async checkDeleteAccess(userId: string) {
    return this.userAdministrationService.checkDeleteAccess({ userId });
  }
}