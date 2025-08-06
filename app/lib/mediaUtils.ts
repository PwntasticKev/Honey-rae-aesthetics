// Platform aspect ratios and optimal dimensions
export const PLATFORM_SPECS = {
  instagram: {
    name: "Instagram",
    aspectRatios: [
      { ratio: "1:1", width: 1080, height: 1080, label: "Square" },
      { ratio: "4:5", width: 1080, height: 1350, label: "Portrait" },
      { ratio: "16:9", width: 1920, height: 1080, label: "Landscape" },
    ],
    optimal: "1:1",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ["image/jpeg", "image/png", "video/mp4"],
  },
  facebook: {
    name: "Facebook",
    aspectRatios: [
      { ratio: "16:9", width: 1920, height: 1080, label: "Landscape" },
      { ratio: "1:1", width: 1200, height: 1200, label: "Square" },
      { ratio: "4:5", width: 1200, height: 1500, label: "Portrait" },
    ],
    optimal: "16:9",
    maxFileSize: 10 * 1024 * 1024,
    supportedFormats: ["image/jpeg", "image/png", "video/mp4"],
  },
  youtube: {
    name: "YouTube",
    aspectRatios: [
      { ratio: "16:9", width: 1920, height: 1080, label: "Standard HD" },
      { ratio: "16:9", width: 1280, height: 720, label: "HD" },
    ],
    optimal: "16:9",
    maxFileSize: 500 * 1024 * 1024, // 500MB for videos
    supportedFormats: ["video/mp4", "video/mov", "video/avi"],
  },
  google_business: {
    name: "Google Business Profile",
    aspectRatios: [
      { ratio: "1:1", width: 720, height: 720, label: "Square" },
      { ratio: "4:3", width: 960, height: 720, label: "Landscape" },
    ],
    optimal: "1:1",
    maxFileSize: 5 * 1024 * 1024,
    supportedFormats: ["image/jpeg", "image/png"],
  },
  tiktok: {
    name: "TikTok",
    aspectRatios: [
      { ratio: "9:16", width: 1080, height: 1920, label: "Vertical" },
      { ratio: "1:1", width: 1080, height: 1080, label: "Square" },
    ],
    optimal: "9:16",
    maxFileSize: 500 * 1024 * 1024,
    supportedFormats: ["video/mp4", "video/mov"],
  },
  linkedin: {
    name: "LinkedIn",
    aspectRatios: [
      { ratio: "1.91:1", width: 1200, height: 627, label: "Link Preview" },
      { ratio: "1:1", width: 1080, height: 1080, label: "Square" },
      { ratio: "4:5", width: 1080, height: 1350, label: "Portrait" },
    ],
    optimal: "1.91:1",
    maxFileSize: 10 * 1024 * 1024,
    supportedFormats: ["image/jpeg", "image/png", "video/mp4"],
  },
  apple_business: {
    name: "Apple Business Connect",
    aspectRatios: [
      { ratio: "1:1", width: 800, height: 800, label: "Square" },
      { ratio: "4:3", width: 800, height: 600, label: "Landscape" },
    ],
    optimal: "1:1",
    maxFileSize: 2 * 1024 * 1024,
    supportedFormats: ["image/jpeg", "image/png"],
  },
};

// Calculate optimal crop for a given aspect ratio
export function calculateCrop(
  originalWidth: number,
  originalHeight: number,
  targetRatio: string
): { x: number; y: number; width: number; height: number } {
  const [targetWidthRatio, targetHeightRatio] = targetRatio.split(':').map(Number);
  const targetAspect = targetWidthRatio / targetHeightRatio;
  const originalAspect = originalWidth / originalHeight;

  let cropWidth, cropHeight, x, y;

  if (originalAspect > targetAspect) {
    // Original is wider than target - crop sides
    cropHeight = originalHeight;
    cropWidth = originalHeight * targetAspect;
    x = (originalWidth - cropWidth) / 2;
    y = 0;
  } else {
    // Original is taller than target - crop top/bottom
    cropWidth = originalWidth;
    cropHeight = originalWidth / targetAspect;
    x = 0;
    y = (originalHeight - cropHeight) / 2;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

// Generate platform-specific versions of an image
export function generatePlatformVersions(
  originalWidth: number,
  originalHeight: number,
  platforms: string[]
): Array<{
  platform: string;
  ratio: string;
  crop: { x: number; y: number; width: number; height: number };
  targetDimensions: { width: number; height: number };
}> {
  const versions: Array<{
    platform: string;
    ratio: string;
    crop: { x: number; y: number; width: number; height: number };
    targetDimensions: { width: number; height: number };
  }> = [];

  platforms.forEach(platform => {
    const spec = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];
    if (!spec) return;

    // Use the optimal aspect ratio for each platform
    const optimalRatio = spec.aspectRatios.find(ar => ar.ratio === spec.optimal) || spec.aspectRatios[0];
    
    const crop = calculateCrop(originalWidth, originalHeight, optimalRatio.ratio);
    
    versions.push({
      platform,
      ratio: optimalRatio.ratio,
      crop,
      targetDimensions: {
        width: optimalRatio.width,
        height: optimalRatio.height,
      },
    });
  });

  return versions;
}

// Validate file type and size
export function validateMediaFile(
  file: File,
  platforms: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if file type is supported by all target platforms
  const supportedFormats = new Set<string>();
  platforms.forEach(platform => {
    const spec = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];
    if (spec) {
      spec.supportedFormats.forEach(format => supportedFormats.add(format));
    }
  });

  if (!supportedFormats.has(file.type)) {
    errors.push(`File type ${file.type} is not supported by the selected platforms`);
  }

  // Check file size against platform limits
  const maxFileSize = Math.max(
    ...platforms
      .map(platform => PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS]?.maxFileSize || 0)
      .filter(Boolean)
  );

  if (file.size > maxFileSize) {
    errors.push(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`);
  }

  // Additional validations
  if (file.type.startsWith('image/')) {
    // Image validations
    if (file.size > 10 * 1024 * 1024) { // 10MB default for images
      errors.push('Image files should be under 10MB for optimal performance');
    }
  } else if (file.type.startsWith('video/')) {
    // Video validations
    if (file.size > 500 * 1024 * 1024) { // 500MB default for videos
      errors.push('Video files should be under 500MB');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get image dimensions from a File object
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Create canvas with cropped image
export function cropImageToCanvas(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw the cropped image
  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height, // Source rectangle
    0, 0, targetWidth, targetHeight // Destination rectangle
  );

  return canvas;
}

// Convert canvas to blob
export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

// Process image file for multiple platforms
export async function processImageForPlatforms(
  file: File,
  platforms: string[]
): Promise<Array<{
  platform: string;
  ratio: string;
  blob: Blob;
  dimensions: { width: number; height: number };
  originalCrop: { x: number; y: number; width: number; height: number };
}>> {
  const dimensions = await getImageDimensions(file);
  const versions = generatePlatformVersions(dimensions.width, dimensions.height, platforms);
  
  // Create image element
  const img = new Image();
  const imageUrl = URL.createObjectURL(file);
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const results = [];

  for (const version of versions) {
    try {
      const canvas = cropImageToCanvas(
        img,
        version.crop,
        version.targetDimensions.width,
        version.targetDimensions.height
      );
      
      const blob = await canvasToBlob(canvas, 0.9);
      
      results.push({
        platform: version.platform,
        ratio: version.ratio,
        blob,
        dimensions: version.targetDimensions,
        originalCrop: version.crop,
      });
    } catch (error) {
      console.error(`Failed to process image for ${version.platform}:`, error);
    }
  }

  URL.revokeObjectURL(imageUrl);
  return results;
}

// Get recommended posting times for platforms
export function getRecommendedPostingTimes(): Record<string, Array<{ day: string; times: string[] }>> {
  return {
    instagram: [
      { day: "Monday", times: ["11:00 AM", "2:00 PM"] },
      { day: "Tuesday", times: ["11:00 AM", "2:00 PM"] },
      { day: "Wednesday", times: ["11:00 AM", "2:00 PM"] },
      { day: "Thursday", times: ["11:00 AM", "2:00 PM"] },
      { day: "Friday", times: ["10:00 AM", "1:00 PM"] },
      { day: "Saturday", times: ["10:00 AM", "1:00 PM"] },
      { day: "Sunday", times: ["10:00 AM", "1:00 PM"] },
    ],
    facebook: [
      { day: "Monday", times: ["9:00 AM", "3:00 PM"] },
      { day: "Tuesday", times: ["9:00 AM", "3:00 PM"] },
      { day: "Wednesday", times: ["9:00 AM", "3:00 PM"] },
      { day: "Thursday", times: ["9:00 AM", "3:00 PM"] },
      { day: "Friday", times: ["9:00 AM", "1:00 PM"] },
      { day: "Saturday", times: ["12:00 PM", "2:00 PM"] },
      { day: "Sunday", times: ["12:00 PM", "1:00 PM"] },
    ],
    tiktok: [
      { day: "Monday", times: ["6:00 AM", "10:00 AM", "7:00 PM"] },
      { day: "Tuesday", times: ["2:00 AM", "4:00 AM", "9:00 AM"] },
      { day: "Wednesday", times: ["7:00 AM", "8:00 AM", "11:00 AM"] },
      { day: "Thursday", times: ["9:00 AM", "12:00 PM", "7:00 PM"] },
      { day: "Friday", times: ["5:00 AM", "1:00 PM", "3:00 PM"] },
      { day: "Saturday", times: ["11:00 AM", "7:00 PM", "8:00 PM"] },
      { day: "Sunday", times: ["7:00 AM", "8:00 AM", "4:00 PM"] },
    ],
    linkedin: [
      { day: "Monday", times: ["8:00 AM", "12:00 PM", "5:00 PM"] },
      { day: "Tuesday", times: ["8:00 AM", "10:00 AM", "12:00 PM"] },
      { day: "Wednesday", times: ["8:00 AM", "10:00 AM", "12:00 PM"] },
      { day: "Thursday", times: ["9:00 AM", "1:00 PM", "5:00 PM"] },
      { day: "Friday", times: ["8:00 AM", "12:00 PM"] },
      { day: "Saturday", times: ["10:00 AM", "2:00 PM"] },
      { day: "Sunday", times: ["12:00 PM", "4:00 PM"] },
    ],
    youtube: [
      { day: "Monday", times: ["2:00 PM", "8:00 PM"] },
      { day: "Tuesday", times: ["2:00 PM", "8:00 PM"] },
      { day: "Wednesday", times: ["2:00 PM", "8:00 PM"] },
      { day: "Thursday", times: ["2:00 PM", "8:00 PM"] },
      { day: "Friday", times: ["3:00 PM", "8:00 PM"] },
      { day: "Saturday", times: ["9:00 AM", "11:00 AM"] },
      { day: "Sunday", times: ["9:00 AM", "11:00 AM"] },
    ],
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if platform supports video
export function platformSupportsVideo(platform: string): boolean {
  const spec = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];
  return spec ? spec.supportedFormats.some(format => format.startsWith('video/')) : false;
}

// Get character limit for platform
export function getPlatformCharacterLimit(platform: string): number {
  const limits: Record<string, number> = {
    instagram: 2200,
    facebook: 2000,
    youtube: 5000,
    google_business: 1500,
    tiktok: 150,
    linkedin: 3000,
    apple_business: 500,
  };
  
  return limits[platform] || 500;
}