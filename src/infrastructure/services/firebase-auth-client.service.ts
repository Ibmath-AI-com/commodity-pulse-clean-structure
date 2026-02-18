{/*import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/src/infrastructure/firebase/firebase.client";
import type { IAuthClientService, AuthCredential } from "@/src/application/services/auth-client.service.interface";

export class FirebaseAuthClientService implements IAuthClientService {
  async authenticate(input: { email: string; password: string }): Promise<AuthCredential> {
    const cred = await signInWithEmailAndPassword(auth, input.email, input.password);
    return {
      uid: cred.user.uid,
      email: cred.user.email,
      getIdToken: () => cred.user.getIdToken(),
    };
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}*/}
