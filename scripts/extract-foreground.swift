import AppKit
import CoreImage
import Foundation
import Vision

guard CommandLine.arguments.count == 3 else {
  fputs("Usage: swift extract-foreground.swift <input> <output>\n", stderr)
  exit(1)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard
  let image = NSImage(contentsOf: inputURL),
  let imageData = image.tiffRepresentation,
  let bitmap = NSBitmapImageRep(data: imageData),
  let cgImage = bitmap.cgImage
else {
  fputs("Unable to read input image\n", stderr)
  exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cgImage)
try handler.perform([request])

guard let result = request.results?.first else {
  fputs("No foreground subject detected\n", stderr)
  exit(1)
}

let maskBuffer = try result.generateScaledMaskForImage(
  forInstances: result.allInstances,
  from: handler
)
let foreground = CIImage(cgImage: cgImage)
let mask = CIImage(cvPixelBuffer: maskBuffer)
let transparent = CIImage(color: .clear).cropped(to: foreground.extent)

guard let filter = CIFilter(name: "CIBlendWithMask") else {
  fputs("Unable to create mask filter\n", stderr)
  exit(1)
}

filter.setValue(foreground, forKey: kCIInputImageKey)
filter.setValue(transparent, forKey: kCIInputBackgroundImageKey)
filter.setValue(mask, forKey: kCIInputMaskImageKey)

let context = CIContext(options: [.useSoftwareRenderer: false])
guard
  let outputImage = filter.outputImage,
  let outputCGImage = context.createCGImage(outputImage, from: foreground.extent)
else {
  fputs("Unable to render transparent image\n", stderr)
  exit(1)
}

let outputBitmap = NSBitmapImageRep(cgImage: outputCGImage)
guard let pngData = outputBitmap.representation(using: .png, properties: [:]) else {
  fputs("Unable to encode PNG\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(
  at: outputURL.deletingLastPathComponent(),
  withIntermediateDirectories: true
)
try pngData.write(to: outputURL)
