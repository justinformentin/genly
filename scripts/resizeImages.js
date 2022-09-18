import sharp from "sharp";
// import fs from "fs-extra";
// import imageSize from "probe-image-size";


export async function resizeImages(inPath, outDir, filename) {

  // const getImageSizeAsync = (file) => imageSize(fs.createReadStream(file));
  // const dim = await getImageSizeAsync(inPath);
  // function getSizes(x) {
  //   return { height: dim.height * (x * 0.33), width: dim.width * (x * 0.25) };
  // }

  const sizes = {
    // '4x': getSizes(4),
    "3x": { width: 1080 },
    "2x": { width: 720 },
    "1x": { width: 360 },
  };

  Object.keys(sizes).forEach((key) => {
    sharp(inPath)
      .resize(sizes[key].width)
      .jpeg({ quality: 90 })
      .toFile(outDir + "/" + filename + key + ".jpg");
  });

  sharp(inPath)
    .resize(1080)
    .blur(10)
    .jpeg({ quality: 5 })
    .toFile(outDir + "/" + "low-" + filename + ".jpg");
}
