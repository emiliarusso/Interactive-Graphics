// bgImg is the background image to be modified -> cb
// fgImg is the foreground image -> cf
// fgOpac is the opacity of the foreground image -> αf
// fgPos is the position of the foreground image in pixels.
// It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.

function composite(bgImg, fgImg, fgOpac, fgPos) {
    // Ensure the foreground image is within the boundaries of the background image
    var startX = Math.max(0, fgPos.x); // starting X position for the overlapping region
    var startY = Math.max(0, fgPos.y); // starting Y position for the overlapping region
    var endX = Math.min(bgImg.width, fgPos.x + fgImg.width); // ending X position for the overlapping region
    var endY = Math.min(bgImg.height, fgPos.y + fgImg.height); // ending Y position for the overlapping region

    // Iterate over each pixel within the overlapping region
    for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
            // Calculate the pixel indices for the background and foreground images
            var bgIndex = (y * bgImg.width + x) * 4; // index of the current pixel in the background image data array
            var fgIndex = ((y - fgPos.y) * fgImg.width + (x - fgPos.x)) * 4; // index of the corresponding pixel in the foreground image data array

            // Calculate the alpha value for the current pixel
            var alpha = fgImg.data[fgIndex + 3] / 255 * fgOpac;
            var invAlpha = 1 - alpha;

            // Perform alpha blending: update the background image with the blended color values
            bgImg.data[bgIndex] = Math.round(invAlpha * bgImg.data[bgIndex] + alpha * fgImg.data[fgIndex]); // Red
            bgImg.data[bgIndex + 1] = Math.round(invAlpha * bgImg.data[bgIndex + 1] + alpha * fgImg.data[fgIndex + 1]); // Green
            bgImg.data[bgIndex + 2] = Math.round(invAlpha * bgImg.data[bgIndex + 2] + alpha * fgImg.data[fgIndex + 2]); // Blue
        }
    }
}
