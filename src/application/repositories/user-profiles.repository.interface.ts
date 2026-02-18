export interface IUserProfilesRepository {
  upsertUserProfile(input: { uid: string; email: string }): Promise<void>;
}
