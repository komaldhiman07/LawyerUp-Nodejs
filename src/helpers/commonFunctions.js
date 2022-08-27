import { CUSTOM_MESSAGES } from '../../config/customMessages';
import { RESPONSE_CODES } from '../../config/constants';
import moment from 'moment';
import $ from 'jsrender'


/** function for check that email is valid or not. */
export const isValidEmail = async (payload) => {
	let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if (payload.match(regexEmail)) {
		return true;
	} else {
		return false;
	}
}

/** function for check that phone number is valid or not. */
export const isValidPhoneNumber = async (payload) => {
	var phoneno = /^\d{10}$/;
	if (payload.match(phoneno)) {
		return true
	} else {
		return false
	}
}

/*** email validation ***/
export const emailValidation = async (email) => {
	let convertedEmail = email.toLowerCase();
	let validEmail = await isValidEmail(convertedEmail);
	if (!validEmail) {
		let response = {};
		response.status = 0;
		response.message = CUSTOM_MESSAGES.INVALID_EMAIL;
		response.code = RESPONSE_CODES.BAD_REQUEST;
		return response;
	}
	return validEmail;
}

/** Function for create logs for request */
export let saveApiLog = async (db, id, type, message, request, response) => {

	let payload = {
		request_id: id,
		type,
		message: JSON.stringify(message),
		response: response ? JSON.stringify(response) : '',
		request: JSON.stringify(request)
	}
	let result = await db.Api_logs.create(payload)
	return result
}
/** Function for update logs for response */
export const updateApiLog = async (db, request_id, id, body, message) => {
	let result = await db.Api_logs.update({ request_id, response: JSON.stringify(body), message: JSON.stringify(message) }, { where: { id } })
	return result
}

/** Function for upload file to S3 Bucket */
export const uploadFlieToAWS = async (params) => {
	return new Promise((resolve, reject) => {
		s3.upload(params, (err, response) => {
			if (err) {
				console.log(err)
				reject(err)
			} else {
				resolve(response)
			}
		})
	})
}

/** Function for delete file from S3 Bucket */
export const deleteFromAWS = async (params) => {
	return new Promise(async (resolve, reject) => {
		s3.deleteObject(params, function (err, data) {
			if (err) console.log(err, err.stack);
			else resolve(data);
		});
	})
}