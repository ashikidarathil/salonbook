import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { injectable } from 'tsyringe';
import { env } from '../../../config/env';
import { IImageService, UploadImageParams, UploadAudioParams } from './IImageService';

type ResourceType = 'image' | 'video' | 'raw';

// Served images get the best format (WebP/AVIF) and quality for each browser automatically
const IMAGE_DELIVERY = 'f_auto,q_auto';
// A Cloudinary transformation path segment, e.g. "f_auto,q_auto" or "w_400,c_fill"
const TRANSFORMATION_SEGMENT = /^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$/;

@injectable()
export class CloudinaryService implements IImageService {
  private rootFolder: string;

  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    this.rootFolder = env.CLOUDINARY_FOLDER;
  }

  private upload(
    buffer: Buffer,
    folder: string,
    resourceType: ResourceType,
    context: Record<string, string>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.rootFolder}/${folder}`,
          public_id: uuidv4(),
          resource_type: resourceType,
          context,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve(
            resourceType === 'image'
              ? result.secure_url.replace('/upload/', `/upload/${IMAGE_DELIVERY}/`)
              : result.secure_url,
          );
        },
      );
      stream.end(buffer);
    });
  }

  // URLs look like https://res.cloudinary.com/<cloud>/<type>/upload/[<transformations>/][v123/]<folder>/<id>.<ext>
  private async deleteByUrl(url: string): Promise<void> {
    const match = url.match(
      /^https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(.+)$/,
    );

    // Skip anything not hosted on Cloudinary (seed/Unsplash links, Google avatars, etc.)
    if (!match) return;

    const [, resourceType, rest] = match;
    const segments = rest.split('/');
    while (segments.length > 1 && TRANSFORMATION_SEGMENT.test(segments[0])) segments.shift();
    if (segments.length > 1 && /^v\d+$/.test(segments[0])) segments.shift();
    const publicId = segments.join('/').replace(/\.[^./]+$/, '');

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as ResourceType,
      invalidate: true,
    });
  }

  async uploadProfilePicture(params: UploadImageParams): Promise<string> {
    const { file, userId, role } = params;

    const optimizedBuffer = await sharp(file.buffer)
      .rotate() // apply the phone's EXIF orientation so photos aren't sideways
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();

    return this.upload(optimizedBuffer, `profiles/${role}/${userId}`, 'image', { userId, role });
  }

  async deleteProfilePicture(pictureUrl: string): Promise<void> {
    await this.deleteByUrl(pictureUrl);
  }

  async uploadServiceImage(params: UploadImageParams & { serviceId: string }): Promise<string> {
    const { file, serviceId } = params;

    const optimizedBuffer = await sharp(file.buffer)
      .rotate()
      .resize(800, 600, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();

    return this.upload(optimizedBuffer, `services/${serviceId}`, 'image', { serviceId });
  }

  async deleteServiceImage(imageUrl: string): Promise<void> {
    await this.deleteByUrl(imageUrl);
  }

  // Cloudinary stores audio under the "video" resource type
  async uploadAudio(params: UploadAudioParams): Promise<string> {
    const { file, roomId, senderId } = params;
    return this.upload(file.buffer, `chat/audio/${roomId}/${senderId}`, 'video', {
      roomId,
      senderId,
    });
  }

  async uploadChatImage(params: UploadAudioParams): Promise<string> {
    const { file, roomId, senderId } = params;
    // Phone photos can be 5-10 MB: fix orientation and shrink to max 1600px. GIFs keep their animation.
    const buffer =
      file.mimetype === 'image/gif'
        ? file.buffer
        : await sharp(file.buffer)
            .rotate()
            .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
    return this.upload(buffer, `chat/images/${roomId}/${senderId}`, 'image', {
      roomId,
      senderId,
    });
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    await this.deleteByUrl(audioUrl);
  }

  // A message's mediaUrl comes from the browser, so never delete a file outside the sender's folder
  async deleteChatMedia(url: string, roomId: string, senderId: string): Promise<void> {
    const owned = ['images', 'audio'].some((kind) =>
      url.includes(`/${this.rootFolder}/chat/${kind}/${roomId}/${senderId}/`),
    );
    if (owned) await this.deleteByUrl(url);
  }
}
