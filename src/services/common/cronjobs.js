// import Album from "../../../database/models/Album";
// import Notification from "../../../database/models/Notification";
// import Transaction from "../../../database/models/Transaction";
// import Device from "../../../database/models/Device";
// import firebase from "./firebase";
// /**Function for get All expired Notification */
// export const expiredAlbums = async () => {
//   const allAlbums = await Album.find({ status: { $in: [4, 6] }, is_deleted: false }).populate(
//     [
//       {
//         path: "experts",
//         select: "first_name last_name",
//       },
//     ]
//   );
//   for (const ele of allAlbums) {
//     const expertName = `${ele.experts[0].first_name} ${ele.experts[0].last_name}`;
//     const album_transaction = await Transaction.findOne({
//       album_id: ele._id,
//       transaction_status: "captured",
//     });
//     if (album_transaction) {
//       const date1 = new Date(album_transaction.created_at);
//       const date2 = new Date();
//       const diffTime = Math.abs(date2 - date1);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       if (diffDays > 7) {
//         await sendNotificationForExpiredAlbum(
//           ele._id,
//           expertName,
//           album_transaction
//         );
//       }
//     }
//   }
//   return;
// };
// /** Function for send notification for expired album and update album status  */
// export const sendNotificationForExpiredAlbum = async (
//   album_id,
//   expertName,
//   album_transaction
// ) => {
//   await Album.findOneAndUpdate({ _id: album_id }, { status: 9 });
//   await Transaction.updateOne(
//     { album_id: album_id },
//     { transaction_status: "expired" }
//   );
//   /** Get Performer device token */
//   let performerDeviceToken = await Device.find({
//     user_id: album_transaction.performer_id,
//   });
//   performerDeviceToken = performerDeviceToken.map((e) => e.device_token);
//   /** Get Expert device token */
//   let expertDeviceToken = await Device.find({
//     user_id: album_transaction.expert_id,
//   });
//   expertDeviceToken = expertDeviceToken.map((e) => e.device_token);
//   /**performer Firebase object */
//   const performerFirebaseObj = {
//     registrationToken: performerDeviceToken,
//     title: "Review Time Expired",
//     message: `${expertName} has not submitted the review within the 7 days, your payment is not deducted from your account.`,
//   };
//   /** Performer Notification object */
//   const performerNotificationObj = {
//     title: performerFirebaseObj.title,
//     message: performerFirebaseObj.message,
//     sender_id: album_transaction.expert_id,
//     receiver_id: album_transaction.performer_id,
//     created_at: new Date(),
//   };
//   /** Expert firebase object */
//   const expertFirebaseObj = {
//     registrationToken: expertDeviceToken,
//     title: "Review Time Expired",
//     message: `Your Review submit time (7 Days) is expired, Now you are not able to send the review.`,
//   };
//   /** Expert Notification object */
//   const expertNotificationObj = {
//     title: expertFirebaseObj.title,
//     message: expertFirebaseObj.message,
//     receiver_id: album_transaction.expert_id,
//     sender_id: album_transaction.performer_id,
//     created_at: new Date(),
//   };
//   /**save performer and expert notification data */
//   await Notification.insertMany([
//     performerNotificationObj,
//     expertNotificationObj,
//   ]);
//   /**Send Notification to performer */
//   try {
//     await firebase.sendNotification(performerFirebaseObj);
//   } catch (e) {
//     console.log(e);
//   }
//   /**Send Notification to expert */
//   try {
//     await firebase.sendNotification(expertFirebaseObj);
//   } catch (e) {
//     console.log(e);
//   }
//   return;
// };
