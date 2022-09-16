import { visit } from "unist-util-visit";

/**
 * Extensions recognized as images by default
 */
export const defaultImageExtensions = [
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
];

export function renderCustomImgMarkup({
  imageExtensions = defaultImageExtensions,
} = {}) {
  const imgExtRegex = new RegExp(`\\.(${imageExtensions.join("|")})$`);
  const isImgExt = (value) => imgExtRegex.test(value);
  const isImgPath = (value) =>  value.startsWith("/") || value.startsWith("./") || value.startsWith("../");

  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.tagName === "img") {
        const lowResImg = node.properties.src.replace(
          "./images/",
          "./images/low-"
        );
        // Test low res image
        // const lowResImg = "http://i.stack.imgur.com/zWfJ5.jpg";
        const size = "width: 1080px; height: 720px; display: block;";
        const style = ` background-image: url(${lowResImg}); background-size: cover; ${size}`;

        const src = node.properties.src;
        const noExt = src.slice(0, -4);

        node.properties.srcset = `
                    ${noExt}3x.jpg 1080w,
                    ${noExt}2x.jpg 720w,
                    ${noExt}1x.jpg 360w
                  `;
        node.properties.loading = "lazy";
        node.properties.style = style;
      }
    });
  };
}
