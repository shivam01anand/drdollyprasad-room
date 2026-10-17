"""CPU perspective projection of the real scan for scale/placement review.

This is a scene composition check, not a substitute for WebGL browser QA.
python3 scripts/figure/review_placement.py --scan /path/isolated.ply --out review/scan-corner
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image
from splat import read_ply, values, colour, ROOT

parser = argparse.ArgumentParser()
parser.add_argument('--scan', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
profile = json.loads((ROOT/'lib/room/dolly-placement.json').read_text())
camera = json.loads((ROOT/'public/house/house.json').read_text())['cams']['easel']
image = np.asarray(Image.open(args.out/'easel-background.png').convert('RGB'),dtype=np.float32)/255
height,width = image.shape[:2]
data = read_ply(args.scan)
yaw = np.radians(profile['yaw_degrees'])
c,s = np.cos(yaw),np.sin(yaw)
rotation = np.array([[c,0,-s],[0,-1,0],[-s,0,-c]])
world = (values(data,'xyz')-profile['source_seat'])@rotation.T*profile['scale']+profile['studio_seat']
eye,target = np.array(camera['eye']),np.array(camera['target'])
forward = target-eye
forward /= np.linalg.norm(forward)
right = np.cross(forward,[0,1,0]);right /= np.linalg.norm(right)
up = np.cross(right,forward)
view = np.stack([right,-up,forward])
position = (world-eye)@view.T
focal = height/2/np.tan(np.radians(camera['fov']/2))
pixel = position[:,:2]/position[:,2,None]*focal+[width/2,height/2]
q = values(data,['rot_0','rot_1','rot_2','rot_3'])
q /= np.linalg.norm(q,axis=1)[:,None]
w,x,y,z = q.T
orientation = np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                        [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                        [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]).transpose(2,0,1)
scales = np.exp(values(data,['scale_0','scale_1','scale_2']))*profile['scale']
jacobian = np.zeros((len(data),2,3))
jacobian[:,0,0] = focal/position[:,2]
jacobian[:,1,1] = focal/position[:,2]
jacobian[:,:2,2] = -focal*position[:,:2]/position[:,2,None]**2
matrix = (jacobian@(view@rotation)[None]@orientation)*scales[:,None,:]
covariance = matrix@matrix.transpose(0,2,1)+np.eye(2)*.25
inverse = np.linalg.inv(covariance)
radius = 3*np.sqrt(np.stack([covariance[:,0,0],covariance[:,1,1]],axis=1))
alpha = 1/(1+np.exp(-np.clip(data['opacity'],-60,60)))
rgb = colour(data)
for i in np.argsort(-position[:,2]):
    if position[i,2] <= .05 or alpha[i] < 45/255:continue
    x0,y0 = np.maximum(np.floor(pixel[i]-radius[i]).astype(int),0)
    x1,y1 = np.minimum(np.ceil(pixel[i]+radius[i]).astype(int)+1,[width,height])
    if x1<=x0 or y1<=y0:continue
    yy,xx = np.mgrid[y0:y1,x0:x1]
    dx,dy = xx-pixel[i,0],yy-pixel[i,1]
    distance = inverse[i,0,0]*dx*dx+2*inverse[i,0,1]*dx*dy+inverse[i,1,1]*dy*dy
    opacity = (np.exp(-distance/2)*alpha[i])[:,:,None]
    image[y0:y1,x0:x1] = image[y0:y1,x0:x1]*(1-opacity)+rgb[i]*opacity
Image.fromarray(np.clip(image*255,0,255).astype('uint8')).save(args.out/'easel-placement.png')
print('Placement review:',args.out/'easel-placement.png')
