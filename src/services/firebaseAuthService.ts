import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

class FirebaseAuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  private formatUser(user: User): AuthUser {
    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  }

  private handleAuthError(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No se encontró una cuenta con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Formato de email inválido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde';
      case 'auth/popup-closed-by-user':
        return 'La ventana de autenticación fue cerrada';
      case 'auth/cancelled-popup-request':
        return 'Solicitud de autenticación cancelada';
      default:
        console.error('Firebase Auth Error:', error);
        return error.message || 'Error de autenticación';
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: this.formatUser(userCredential.user),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  async registerWithEmail(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil con el nombre si se proporciona
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      return {
        success: true,
        user: this.formatUser(userCredential.user),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const userCredential: UserCredential = await signInWithPopup(auth, this.googleProvider);
      return {
        success: true,
        user: this.formatUser(userCredential.user),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error durante el logout:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  getCurrentAuthUser(): AuthUser | null {
    const user = this.getCurrentUser();
    return user ? this.formatUser(user) : null;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.formatUser(user) : null);
    });
  }

  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  async waitForAuthInit(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;