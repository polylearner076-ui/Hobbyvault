import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firestoreInstance: Firestore | null = null;
let adminApp: App | null = null;

export function getAdminFirestore(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const configRaw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);

    if (!getApps().length) {
      adminApp = initializeApp({
        projectId: config.projectId,
      });
    } else {
      adminApp = getApps()[0];
    }

    const databaseId = config.firestoreDatabaseId;
    if (databaseId && databaseId !== '(default)') {
      try {
        firestoreInstance = getFirestore(adminApp, databaseId);
      } catch {
        firestoreInstance = getFirestore(adminApp);
      }
    } else {
      firestoreInstance = getFirestore(adminApp);
    }
    return firestoreInstance;
  } catch (err) {
    console.warn('Firebase Admin Firestore initialization warning:', err);
    return null;
  }
}
