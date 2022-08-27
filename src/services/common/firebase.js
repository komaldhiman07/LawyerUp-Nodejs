import FCM from "fcm-node";

class FirebaseService {
  constructor() {}

  sendNotification = (data) => {
    const fcm = new FCM(process.env.FCM_SERVER_KEY);
    const message = {
      registration_ids: data.registrationToken,
      notification: {
        title: data.title || null,
        body: data.message,
        sound: "default"
      },
      data: {
        //you can send only notification or only data(or include both)
        my_key: "my value",
        my_another_key: "my another value",
      },
    };

    return new Promise((resolve, reject) => {
      fcm.send(message, (err, result) => {
        if (err) {
          reject(err);
          console.log(err);
        }
        if (result) {
          console.log(result);
          resolve(result);
        }
      });
    });
  };
}
export default new FirebaseService();
