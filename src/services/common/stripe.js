// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// import States from "../../../database/models/State";

// export const createStripeCustomer = async (data) => {
//   const customer = await stripe.customers.create({
//     email: data.email,
//     name: `${data.first_name} ${data.last_name ? data.last_name : ""}`,
//     phone: data.phone,
//   });
//   return customer;
// };

// export const createStripeAccount = async (data, user) => {
//   const state = await States.findOne({ _id: data.state_id });
//   const account = await stripe.accounts.create({
//     type: "express",
//     country: "US",
//     email: user && user.email ? user.email : "",
//     business_profile: {
//       product_description: "Expert / Coach",
//     },
//     capabilities: {
//       card_payments: { requested: true },
//       transfers: { requested: true },
//     },
//     business_type: "individual",
//     individual: {
//       first_name: user && user.first_name ? user.first_name : "",
//       last_name: user && user.last_name ? user.last_name : "",
//       address: {
//         city: data && data.city ? data.city : "",
//         postal_code: data && data.zip_code ? data.zip_code : "",
//         state: state && state.code ? state.code : "",
//       },
//     },
//   });
//   return account;
// };

// export const linkStripeAccount = async (payload) => {
//   return await stripe.accountLinks.create({
//     account: payload.stripe_account_id,
//     refresh_url: `${process.env.API_BASE_URL}/user/stripe-integration/reauth`,
//     return_url:
//       `${process.env.API_BASE_URL}/user/stripe-integration/return?redirectId=` +
//       payload.stripe_account_id +
//       `&syncId=` +
//       payload._id,
//     type: "account_onboarding",
//   });
// };

// export const retriveAccount = async (payload) => {
//   const account = await stripe.accounts.retrieve(payload.stripe_account_id);

//   return account;
// };

// export const createCharge = async (customer_id, payload) => {
//   const charge = await stripe.charges.create({
//     amount: payload.amount * 100,
//     currency: "usd",
//     customer: customer_id,
//     capture: false,
//     transfer_group: payload.transfer_group,
//     transfer_data: {
//       destination: payload.stripe_account_id,
//     },
//   });

//   return charge;
// };

// export const createTransfer = async (payload) => {
//   const transfer = await stripe.transfers.create({
//     amount: 100 * 100,
//     currency: "usd",
//     destination: payload,
//     transfer_group: "Group_62c2bc95bd412c0bee4aa884",
//   });
//   return transfer;
// };

// export const capturedCharge = async (payload) => {
//   const charge = await stripe.charges.capture(payload.charge_id, {
//     transfer_data: {
//       amount: Math.round(parseFloat(payload.amount) * 90),
//     },
//   });
//   return charge;
// };

// export const createCard = async (customer_id, payload) => {
//   const card = await stripe.customers.createSource(customer_id, {
//     source: payload.token,
//   });
//   return card;
// };

// export const cardList = async (customer_id) => {
//   const cards = await stripe.customers.listSources(customer_id, {
//     object: "card",
//     limit: 10,
//   });
//   return cards;
// };

// export const deleteCard = async (customer_id, card_id) => {
//   const deletedCard = await stripe.customers.deleteSource(customer_id, card_id);

//   return deletedCard;
// };

// export const makeDefaultCard = async (customer_id, card_id) => {
//   const defaultCard = await stripe.customers.update(customer_id, {
//     default_source: card_id,
//   });
//   return defaultCard;
// };
