import multer from 'multer';
import {S3,config} from "aws-sdk";
import path from "path";


export class AWSUploader {

  private readonly s3: S3;

  constructor() {
    config.update({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    });

    this.s3 = new S3()

  }
  uploadImage(file: Express.Multer.File, cb: (error: any, data: any) => void) {
    // Check file type
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      this.uploadFile(file, cb);
    } else {
      cb("Error: Please upload images", null);
    }
  }
  uploadFile(file: any, cb: (error: any, data: any) => void) {
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    this.s3.upload(params, (error: any, data: any) => {
      if (error) {
        cb(error, null);
      } else {
        cb(null, data);
      }
    });
  }
}


  
