import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

function readConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'cozbil-dev',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'cozbil-dev.appspot.com',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'demo',
  };
}

export function isFirebaseConfigured(): boolean {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  return Boolean(key && key.length > 0 && key !== 'demo');
}

function createAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // RN bundle resolves firebase/auth → RN entry that exports this.
    // Web TypeScript typings omit it — cast via any.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => unknown;
    };
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage) as never,
    });
  } catch {
    return getAuth(app);
  }
}

let clients: FirebaseClients | null = null;
let emulatorsConnected = false;

export function getFirebase(): FirebaseClients {
  if (clients) return clients;

  const app = getApps().length ? getApp() : initializeApp(readConfig());
  const auth = createAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, 'europe-west1');

  if (process.env.EXPO_PUBLIC_USE_EMULATORS === '1' && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    emulatorsConnected = true;
  }

  clients = { app, auth, db, storage, functions };
  return clients;
}
