import fs from "fs-extra";
import sharp from "sharp";
import imageSize from "probe-image-size";

const getImageSizeAsync = (file) => imageSize(fs.createReadStream(file));

export async function resizeImages (inPath, outDir, filename) {
  const dim = await getImageSizeAsync(inPath);
  // console.log("dim", dim);

  function getSizes(x) {
    return { height: dim.height * (x * 0.33), width: dim.width * (x * 0.25) };
  }
  const sizes = {
    // '4x': getSizes(4),
    "3x": { width: 1080 },
    "2x": { width: 720 },
    "1x": { width: 360 },
  };

  const filenameNoExt = filename.slice(0, -4);
  Object.keys(sizes).forEach((key) => {
    sharp(inPath)
      .resize(sizes[key].width)
      .jpeg({ quality: 90 })
      .toFile(outDir + filenameNoExt + key + ".jpg");
  });

  sharp(inPath)
    .resize(1080)
    .blur(10)
    .jpeg({ quality: 5 })
    .toFile(outDir + "low-" + filename);
}

