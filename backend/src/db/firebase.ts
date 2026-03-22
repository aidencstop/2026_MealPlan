import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Service account key path
const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore instance
export const db = admin.firestore();

// Auth instance
export const auth = admin.auth();

console.log('✅ Firebase Admin 초기화 완료');

export default admin;
