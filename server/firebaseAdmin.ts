import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firestoreInstance: Firestore | null = null;
let adminApp: App | null = null;
let hasCheckedCredentials = false;

export function getAdminFirestore(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  if (hasCheckedCredentials) return null;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      hasCheckedCredentials = true;
      return null;
    }

    // Only attempt Firestore admin if service account or explicit credentials are present
    const hasServiceCredentials =
      Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (!hasServiceCredentials) {
      // In web applet container environments, backend data is persisted in Cloud SQL
      hasCheckedCredentials = true;
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
    hasCheckedCredentials = true;
    return firestoreInstance;
  } catch (err) {
    hasCheckedCredentials = true;
    return null;
  }
}
