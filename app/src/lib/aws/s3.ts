import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_CONFIG, getPublicUrl, isDevelopment } from "./config";
import crypto from "crypto";
import path from "path";

export interface UploadOptions {
  folder?: keyof typeof S3_CONFIG.folders;
  fileName?: string;
  makePublic?: boolean;
  expiresIn?: number; // For pre-signed URLs (in seconds)
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface FileInfo {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export class S3Service {
  private bucket: string;

  constructor() {
    this.bucket = S3_CONFIG.bucket;
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    buffer: Buffer,
    contentType: string,
    options: UploadOptions = {}
  ): Promise<FileInfo> {
    try {
      // In development mode, simulate file upload
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockUpload(buffer, contentType, options);
      }

      const {
        folder = "temp",
        fileName,
        makePublic = false,
        metadata = {},
        tags = {},
      } = options;

      // Generate unique file name if not provided
      const fileExtension = this.getFileExtension(contentType);
      const uniqueFileName = fileName || `${crypto.randomUUID()}${fileExtension}`;
      const key = `${S3_CONFIG.folders[folder]}${uniqueFileName}`;

      // Validate file size
      this.validateFileSize(buffer.length, contentType);

      // Validate file type
      this.validateFileType(contentType);

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalName: fileName || uniqueFileName,
        },
        ServerSideEncryption: "AES256" as const,
        ...(makePublic && { ACL: "public-read" as const }),
        ...(Object.keys(tags).length > 0 && { Tagging: this.formatTags(tags) }),
      };

      // Upload to S3
      await s3Client.send(new PutObjectCommand(uploadParams));

      return {
        key,
        url: makePublic ? getPublicUrl(key) : await this.getSignedUrl(key),
        size: buffer.length,
        contentType,
        lastModified: new Date(),
        metadata: uploadParams.Metadata,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Get a pre-signed URL for temporary access to a private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return `http://localhost:3000/api/files/mock/${encodeURIComponent(key)}`;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error(`Failed to generate signed URL: ${error}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`Mock: Deleted file ${key}`);
        return;
      }

      await s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Copy a file within S3
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<FileInfo> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockCopy(sourceKey, destinationKey);
      }

      await s3Client.send(new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      }));

      // Get file info
      return await this.getFileInfo(destinationKey);
    } catch (error) {
      console.error("S3 copy error:", error);
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockFileInfo(key);
      }

      const response = await s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));

      return {
        key,
        url: getPublicUrl(key),
        size: response.ContentLength || 0,
        contentType: response.ContentType || "application/octet-stream",
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("Error getting file info:", error);
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(
    folder: keyof typeof S3_CONFIG.folders,
    maxKeys: number = 100
  ): Promise<FileInfo[]> {
    try {
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return this.mockListFiles(folder, maxKeys);
      }

      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: S3_CONFIG.folders[folder],
        MaxKeys: maxKeys,
      }));

      if (!response.Contents) {
        return [];
      }

      return Promise.all(
        response.Contents.map(async (object) => ({
          key: object.Key!,
          url: getPublicUrl(object.Key!),
          size: object.Size || 0,
          contentType: "application/octet-stream", // Would need separate call to get this
          lastModified: object.LastModified || new Date(),
        }))
      );
    } catch (error) {
      console.error("Error listing files:", error);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  /**
   * Move file from temp to permanent location
   */
  async moveFromTemp(
    tempKey: string,
    folder: keyof typeof S3_CONFIG.folders,
    newFileName?: string
  ): Promise<FileInfo> {
    const fileName = newFileName || path.basename(tempKey);
    const newKey = `${S3_CONFIG.folders[folder]}${fileName}`;
    
    // Copy to new location
    const fileInfo = await this.copyFile(tempKey, newKey);
    
    // Delete from temp
    await this.deleteFile(tempKey);
    
    return fileInfo;
  }

  /**
   * Generate upload URL for direct client uploads
   */
  async getUploadUrl(
    folder: keyof typeof S3_CONFIG.folders,
    fileName: string,
    contentType: string,
    expiresIn: number = 300 // 5 minutes
  ): Promise<{ uploadUrl: string; key: string }> {
    try {
      const key = `${S3_CONFIG.folders[folder]}${fileName}`;
      
      if (isDevelopment && !process.env.AWS_ACCESS_KEY_ID) {
        return {
          uploadUrl: `http://localhost:3000/api/files/upload?key=${encodeURIComponent(key)}`,
          key,
        };
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

      return { uploadUrl, key };
    } catch (error) {
      console.error("Error generating upload URL:", error);
      throw new Error(`Failed to generate upload URL: ${error}`);
    }
  }

  // Private helper methods
  private validateFileSize(size: number, contentType: string): void {
    let limit: number;
    
    if (contentType.startsWith("image/")) {
      limit = S3_CONFIG.limits.image;
    } else if (contentType.startsWith("video/")) {
      limit = S3_CONFIG.limits.video;
    } else {
      limit = S3_CONFIG.limits.document;
    }

    if (size > limit) {
      throw new Error(`File size (${Math.round(size / 1024 / 1024)}MB) exceeds limit (${Math.round(limit / 1024 / 1024)}MB)`);
    }
  }

  private validateFileType(contentType: string): void {
    const isAllowed = [
      ...S3_CONFIG.allowedTypes.images,
      ...S3_CONFIG.allowedTypes.documents,
      ...S3_CONFIG.allowedTypes.videos,
    ].includes(contentType);

    if (!isAllowed) {
      throw new Error(`File type ${contentType} is not allowed`);
    }
  }

  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
      "text/plain": ".txt",
      "video/mp4": ".mp4",
      "video/mpeg": ".mpeg",
      "video/quicktime": ".mov",
    };

    return extensions[contentType] || "";
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  // Mock implementations for development
  private async mockUpload(
    buffer: Buffer,
    contentType: string,
    options: UploadOptions
  ): Promise<FileInfo> {
    const { folder = "temp", fileName } = options;
    const fileExtension = this.getFileExtension(contentType);
    const uniqueFileName = fileName || `${crypto.randomUUID()}${fileExtension}`;
    const key = `${S3_CONFIG.folders[folder]}${uniqueFileName}`;

    return {
      key,
      url: `http://localhost:3000/api/files/mock/${encodeURIComponent(key)}`,
      size: buffer.length,
      contentType,
      lastModified: new Date(),
      metadata: { mock: "true" },
    };
  }

  private async mockCopy(sourceKey: string, destinationKey: string): Promise<FileInfo> {
    return {
      key: destinationKey,
      url: `http://localhost:3000/api/files/mock/${encodeURIComponent(destinationKey)}`,
      size: 1024,
      contentType: "application/octet-stream",
      lastModified: new Date(),
      metadata: { mock: "true", copiedFrom: sourceKey },
    };
  }

  private async mockFileInfo(key: string): Promise<FileInfo> {
    return {
      key,
      url: `http://localhost:3000/api/files/mock/${encodeURIComponent(key)}`,
      size: 1024,
      contentType: "application/octet-stream",
      lastModified: new Date(),
      metadata: { mock: "true" },
    };
  }

  private async mockListFiles(
    folder: keyof typeof S3_CONFIG.folders,
    maxKeys: number
  ): Promise<FileInfo[]> {
    // Return some mock files for development
    return [
      {
        key: `${S3_CONFIG.folders[folder]}sample1.jpg`,
        url: `http://localhost:3000/api/files/mock/sample1.jpg`,
        size: 2048,
        contentType: "image/jpeg",
        lastModified: new Date(),
        metadata: { mock: "true" },
      },
      {
        key: `${S3_CONFIG.folders[folder]}sample2.pdf`,
        url: `http://localhost:3000/api/files/mock/sample2.pdf`,
        size: 4096,
        contentType: "application/pdf",
        lastModified: new Date(),
        metadata: { mock: "true" },
      },
    ].slice(0, maxKeys);
  }
}

// Export singleton instance
export const s3Service = new S3Service();