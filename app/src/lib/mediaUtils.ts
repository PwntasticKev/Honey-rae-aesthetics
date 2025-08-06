export const PLATFORM_SPECS = {
  instagram: {
    aspectRatio: "1:1",
    maxSize: 1080,
    maxLength: 60,
  },
  facebook: {
    aspectRatio: "1.91:1",
    maxSize: 1200,
    maxLength: 240,
  },
  tiktok: {
    aspectRatio: "9:16",
    maxSize: 1080,
    maxLength: 60,
  },
};

export const validateMediaFile = (file, platform) => {
  const spec = PLATFORM_SPECS[platform];
  if (!spec) {
    return { valid: false, message: "Invalid platform specified." };
  }
  return { valid: true, message: "" };
};

export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const processImageForPlatforms = async (file, platforms) => {
  const processed = {};
  for (const platform of platforms) {
    processed[platform] = {
      url: URL.createObjectURL(file),
      platform,
    };
  }
  return processed;
};
