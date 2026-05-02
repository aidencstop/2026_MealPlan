import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

export default admin;
