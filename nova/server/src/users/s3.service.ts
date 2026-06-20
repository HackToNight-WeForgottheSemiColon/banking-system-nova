import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const region = process.env.AWS_REGION || 'us-east-1'
    this.bucketName = process.env.AWS_S3_BUCKET || 'nova-bank-hack2night'

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS S3 credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are missing.'
      )
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'avatars'
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop() || 'jpg'
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`

    this.logger.log(
      `Uploading file ${file.originalname} to S3 bucket ${this.bucketName}...`
    )

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        })
      )

      const region = process.env.AWS_REGION || 'us-east-1'
      // Construct S3 URL
      const url =
        region === 'us-east-1'
          ? `https://${this.bucketName}.s3.amazonaws.com/${key}`
          : `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`

      this.logger.log(`File uploaded successfully to S3: ${url}`)
      return url
    } catch (err: any) {
      this.logger.error(
        `S3 upload failed for file ${file.originalname}: ${err.message}`
      )
      throw new Error(`Failed to upload file to S3: ${err.message}`)
    }
  }
}
