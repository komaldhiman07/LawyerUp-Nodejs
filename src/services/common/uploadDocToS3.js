import { RESPONSE_CODES } from "../../../config/constants";
import { CUSTOM_MESSAGES } from "../../../config/customMessages";
import fs from "fs";
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();

class UploadDocument {
  constructor() { }

  uploadFiles = async (req, res) => {
    let response;
    try {
      const { files, body, user } = req;
      console.log("user 0000:", user)
      response = await uploadDocs(files, body.type, user.data.username);
      return response;
    } catch (error) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UPLOAD_DOCUMENT_ERROR,
      };
    }
  };

  // { Bucket: `${process.env.AWS_BUCKET}`, Key: file_key }
  deleteFileFromAWS = async (params) =>
    new Promise(async (resolve) => {
      s3.deleteObject(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else resolve(data);
      });
    });
  /** Delete Folder from AWS */
  emptyBucket(params) {
    s3.listObjects(params, function (err, data) {
      if (err) return;

      if (data.Contents.length == 0) return

      params = { Bucket: process.env.AWS_BUCKET };
      params.Delete = { Objects: [] };

      data.Contents.forEach(function (content) {
        params.Delete.Objects.push({ Key: content.Key });
      });
      s3.deleteObjects(params, function (err, data) {
        if (err) return err
        if (data.IsTruncated) {
          emptyBucket(bucketName, callback);
        } else {
          return
        }
      });
    });
  }

}
export default new UploadDocument();

const uploadDocs = async (files, type, username) => {
  try {
    const response = {};
    const uploadedFiles = [];

    for (const ele of files) {
      const data = fs.readFileSync(ele.path);
      fs.unlinkSync(ele.path);
      const params = {
        Bucket:
          type && typeof type === "string"
            ? `${process.env.AWS_BUCKET}/${type}`
            : type && type.length > 0
              ? `${process.env.AWS_BUCKET}/${type[0]}`
              : process.env.AWS_BUCKET,
        // 'Bucket': process.env.AWS_BUCKET,
        Key: `${Date.now()}-${username}`,
        Body: data,
        contentType: ele.mimetype,
        ACL: "public-read",
      };
      const result = await uploadFileToAWS(params);
      ele.location = result.Location;
      ele.key = result.Key;
      console.log("S3 file upload result : ", result);
    }
    if (files) {
      if (files.length > 0) {
        files.forEach((file) => {
          const upload = {
            path: file.location,
            type: file.mimetype,
            name: file.originalname,
            file_key: file.key,
          };
          uploadedFiles.push(upload);
        });
      }
    }
    response.status = RESPONSE_CODES.POST;
    response.success= true;
    response.message = CUSTOM_MESSAGES.FILE_UPLOADED;
    response.data = uploadedFiles;
    console.log("response : ", response)
    return response;
  } catch (error) {
    this.logger.logError("Upload File Error: ", error);
    throw error;
  }
};

export const uploadFileToAWS = async (params) =>
  new Promise((resolve, reject) => {
    s3.upload(params, (err, response) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
