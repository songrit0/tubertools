const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setUserPassword = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Not authenticated');
  }

  // Verify caller is admin via Realtime Database role
  const callerSnap = await admin.database()
    .ref(`users/${request.auth.uid}/role`)
    .get();
  const callerRole = callerSnap.val();

  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { uid, password } = request.data;

  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }

  await admin.auth().updateUser(uid, { password });
  return { success: true };
});
