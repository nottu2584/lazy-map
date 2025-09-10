import { IUserRepository } from '@lazy-map/domain';
import { AdminGuard, AdminAuthContext } from '../guards';
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
} from '../use-cases/admin';

export class UserAdministrationService {
  private readonly adminGuard: AdminGuard;
  private readonly listUsersUseCase: ListUsersUseCase;
  private readonly updateUserUseCase: UpdateUserUseCase;
  private readonly suspendUserUseCase: SuspendUserUseCase;
  private readonly reactivateUserUseCase: ReactivateUserUseCase;
  private readonly promoteUserUseCase: PromoteUserUseCase;
  private readonly deleteUserUseCase: DeleteUserUseCase;
  private readonly getUserStatsUseCase: GetUserStatsUseCase;

  constructor(
    private readonly userRepository: IUserRepository
  ) {
    this.adminGuard = new AdminGuard(userRepository);
    this.listUsersUseCase = new ListUsersUseCase(userRepository);
    this.updateUserUseCase = new UpdateUserUseCase(userRepository);
    this.suspendUserUseCase = new SuspendUserUseCase(userRepository);
    this.reactivateUserUseCase = new ReactivateUserUseCase(userRepository);
    this.promoteUserUseCase = new PromoteUserUseCase(userRepository);
    this.deleteUserUseCase = new DeleteUserUseCase(userRepository);
    this.getUserStatsUseCase = new GetUserStatsUseCase(userRepository);
  }

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

  async checkAdminAccess(context: AdminAuthContext) {
    return this.adminGuard.requireAdminAccess(context);
  }

  async checkSuperAdminAccess(context: AdminAuthContext) {
    return this.adminGuard.requireSuperAdminAccess(context);
  }

  async checkDeleteAccess(context: AdminAuthContext) {
    return this.adminGuard.requireDeleteAccess(context);
  }
}