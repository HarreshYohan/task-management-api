import { 
    S3Client, 
    PutObjectCommand, 
    DeleteObjectCommand, 
    GetObjectCommand 
  } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { v4 as uuidv4 } from 'uuid';
  import config from '../config';
  import { ApiError } from '../middlewares/errorHandlers';
  
  // Initialize S3 client
  const s3Client = new S3Client({
    region: config.AWS.REGION,
    credentials: {
      accessKeyId: config.AWS.ACCESS_KEY_ID!,
      secretAccessKey: config.AWS.SECRET_ACCESS_KEY!,
    }
  });
  
  const bucketName = config.S3.BUCKET_NAME;
  
  /**
   * Generate a pre-signed URL for file upload
   * @param fileType MIME type of the file
   * @returns Object containing the upload URL and the file key
   */
  export const generateUploadUrl = async (fileType: string): Promise<{ uploadUrl: string; fileKey: string }> => {
    try {
      const fileKey = `${uuidv4()}-${Date.now()}`;
      
      const params = {
        Bucket: bucketName,
        Key: fileKey,
        ContentType: fileType,
      };
  
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
      
      return {
        uploadUrl,
        fileKey,
      };
    } catch (error) {
      console.error('Error generating S3 upload URL:', error);
      throw new ApiError(500, 'Failed to generate file upload URL');
    }
  };
  
  /**
   * Generate a pre-signed URL for file download
   * @param fileKey The file key in S3
   * @returns Download URL
   */
  export const generateDownloadUrl = async (fileKey: string): Promise<string> => {
    try {
      const params = {
        Bucket: bucketName,
        Key: fileKey,
      };
  
      const command = new GetObjectCommand(params);
      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
      
      return downloadUrl;
    } catch (error) {
      console.error(`Error generating S3 download URL for key ${fileKey}:`, error);
      throw new ApiError(500, 'Failed to generate file download URL');
    }
  };
  
  /**
   * Delete a file from S3
   * @param fileKey The file key in S3
   * @returns True if deleted successfully
   */
  export const deleteFile = async (fileKey: string): Promise<boolean> => {
    try {
      // Extract the file key from a URL if provided
      const actualKey = fileKey.includes('/') 
        ? fileKey.split('/').pop()! 
        : fileKey;
  
      const params = {
        Bucket: bucketName,
        Key: actualKey,
      };
  
      await s3Client.send(new DeleteObjectCommand(params));
      return true;
    } catch (error) {
      console.error(`Error deleting file with key ${fileKey} from S3:`, error);
      throw new ApiError(500, 'Failed to delete file from storage');
    }
  };
  
  /**
   * Get public URL for a file
   * @param fileKey The file key in S3
   * @returns Public URL string
   */
  export const getPublicFileUrl = (fileKey: string): string => {
    return `https://${bucketName}.s3.${config.AWS.REGION}.amazonaws.com/${fileKey}`;
  };