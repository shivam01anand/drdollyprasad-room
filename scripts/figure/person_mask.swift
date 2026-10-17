// Local semantic masks used to crop the 3D Gaussians, not to invent image detail.
// swiftc scripts/figure/person_mask.swift -o /tmp/dolly-person-mask
// /tmp/dolly-person-mask <render.png> <mask.png> [legacy]
import AppKit
import CoreImage
import Vision

guard CommandLine.arguments.count >= 3 else {
    print("usage: person-mask <render.png> <mask.png> [legacy]")
    exit(1)
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
guard let image = CIImage(contentsOf: input, options: [.applyOrientationProperty: true]) else {
    print("Cannot open render")
    exit(1)
}
let handler = VNImageRequestHandler(ciImage: image)
let mask: CIImage
if CommandLine.arguments.last == "legacy" {
    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .accurate
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try handler.perform([request])
    guard let result = request.results?.first else {
        print("No person mask returned")
        exit(2)
    }
    mask = CIImage(cvPixelBuffer: result.pixelBuffer)
} else {
    let request = VNGeneratePersonInstanceMaskRequest()
    try handler.perform([request])
    guard let result = request.results?.first, result.allInstances.count == 1 else {
        print("Expected exactly one person in the review render")
        exit(2)
    }
    mask = CIImage(cvPixelBuffer: try result.generateScaledMaskForImage(
        forInstances: result.allInstances, from: handler
    ))
}
let scaled = mask.transformed(by: CGAffineTransform(
    scaleX: image.extent.width / mask.extent.width,
    y: image.extent.height / mask.extent.height
)).cropped(to: image.extent)
let context = CIContext()
guard let cg = context.createCGImage(scaled, from: scaled.extent),
      let png = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:]) else {
    print("Cannot encode mask")
    exit(3)
}
try png.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
print("Person mask:", CommandLine.arguments[2])
