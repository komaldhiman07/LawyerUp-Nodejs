import admin from "firebase-admin";
import serviceAccount from "../../../config/lawyerup-dev-e2ea0-firebase-adminsdk-fbsvc-256bd10cba.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("[Firebase] Admin SDK initialised using service account file.");
}

class FirebaseService {
  /**
   * Send a push notification to one or more device tokens.
   *
   * @param {object} opts
   * @param {string|string[]} opts.registrationToken  - Device FCM token(s)
   * @param {string}          opts.title              - Notification title
   * @param {string}          opts.message            - Notification body
   * @param {object}          [opts.payload]          - Data fields (all values coerced to strings)
   * @returns {Promise<PromiseSettledResult[]>}
   */
  sendNotification = async ({ registrationToken, title, message, payload }) => {
    const safePayload = payload || {};
    const tokens = Array.isArray(registrationToken)
      ? registrationToken
      : [registrationToken];

    // Coerce all data values to strings (FCM requirement)
    const dataPayload = {};
    Object.keys(safePayload).forEach(function(k) {
      var v = safePayload[k];
      dataPayload[k] = v !== null && v !== undefined ? String(v) : "";
    });

    const results = await Promise.allSettled(
      tokens.map(function(token) {
        return admin.messaging().send({
          token: token,
          notification: { title: title, body: message },
          data: dataPayload,
          apns: { payload: { aps: { sound: "default" } } },
          android: { priority: "high" },
        });
      })
    );

    results.forEach(function(r, i) {
      if (r.status === "rejected") {
        console.error("[FCM] Failed to send to token[" + i + "]:", (r.reason && r.reason.message) || r.reason);
      }
    });

    return results;
  };
}

export default new FirebaseService();
