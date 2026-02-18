// src/infrastructure/repositories/user-profiles.repository.firestore.ts

import "server-only";

import type { IUserProfilesRepository } from "@/src/application/repositories/user-profiles.repository.interface";
import { adminDb } from "@/src/infrastructure/firebase/firebase.admin";

export class FirestoreUserProfilesRepository implements IUserProfilesRepository {
  async upsertUserProfile(input: { uid: string; email: string }): Promise<void> {
    await adminDb.collection("users").doc(input.uid).set(
      {
        email: input.email,
        role: "user",
        updatedAt: new Date(),
        createdAt: new Date(),
      },
      { merge: true }
    );
  }
}
