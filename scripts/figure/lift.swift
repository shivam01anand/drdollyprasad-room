// Lift the person (and what she holds) out of a photograph, on this machine, with Apple's
// Vision subject lifting: writes an RGBA PNG of the subject, background transparent.
//
//   swift scripts/figure/lift.swift <in.jpg> <out.png> [instance indices, e.g. 1,2]
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: lift <in> <out> [instances]"); exit(1) }
let url = URL(fileURLWithPath: args[1])
guard let ci = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else { print("cannot read"); exit(1) }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { print("no subject found"); exit(2) }
print("instances:", Array(obs.allInstances))
var pick = obs.allInstances
if args.count >= 4 { pick = IndexSet(args[3].split(separator: ",").compactMap { Int($0) }) }
let buf = try obs.generateMaskedImage(ofInstances: pick, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
let rep = NSBitmapImageRep(cgImage: ctx.createCGImage(out, from: out.extent)!)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("wrote", args[2], Int(out.extent.width), "x", Int(out.extent.height))
