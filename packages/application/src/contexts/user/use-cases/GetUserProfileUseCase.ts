import { IUserRepository, UserId } from '@lazy-map/domain';

export class GetUserProfileQuery {
  constructor(
    public readonly userId: string
  ) {}
}

export interface GetUserProfileResult {
  success: boolean;
  user?: import('@lazy-map/domain').User;
  errors: string[];
}

/**
 * Use case for retrieving user profile information
 */
export class GetUserProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserProfileQuery): Promise<GetUserProfileResult> {
    const errors: string[] = [];

    try {
      const userId = UserId.fromString(query.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        errors.push('User not found');
        return { success: false, errors };
      }

      return {
        success: true,
        user,
        errors: []
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user profile';
      errors.push(errorMessage);
      
      return {
        success: false,
        errors
      };
    }
  }
}