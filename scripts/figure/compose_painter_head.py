"""Project the isolated 3D head using the exact web transform and review cameras.

This checks model placement and likeness; it does not claim browser verification.
"""
from pathlib import Path
import argparse,json,numpy as np
from PIL import Image
from splat import ROOT,values,colour
parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);args=parser.parse_args();out=args.directory
data=np.load(out/'head-source.npy');profile=json.loads((ROOT/'lib/room/dolly-head-placement.json').read_text());shots=json.loads((out/'review-cameras.json').read_text())
rotation=np.array(profile['blender_rotation']);world=values(data,'xyz')@rotation.T*profile['scale']+profile['blender_position']
q=values(data,['rot_0','rot_1','rot_2','rot_3']);q/=np.linalg.norm(q,axis=1)[:,None];w,x,y,z=q.T
orientation=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]).transpose(2,0,1)
scales=np.exp(values(data,['scale_0','scale_1','scale_2']))*profile['scale'];alpha=1/(1+np.exp(-np.clip(data['opacity'],-60,60)));rgb=colour(data)
for name,shot in shots.items():
    image=np.array(Image.open(out/f'{name}-background.png').convert('RGB'),dtype=float)/255;height,width=image.shape[:2];camera=np.array(shot['camera']);view=camera[:3,:3].T.copy();view[1:]*=-1
    position=(world-camera[:3,3])@view.T;focal=shot['focal'];pixel=position[:,:2]/position[:,2,None]*focal+[width/2,height/2]
    jacobian=np.zeros((len(data),2,3));jacobian[:,0,0]=focal/position[:,2];jacobian[:,1,1]=focal/position[:,2];jacobian[:,:2,2]=-focal*position[:,:2]/position[:,2,None]**2
    matrix=(jacobian@(view@rotation)[None]@orientation)*scales[:,None,:];cov=matrix@matrix.transpose(0,2,1)+np.eye(2)*.25;inverse=np.linalg.inv(cov);radius=3*np.sqrt(np.stack([cov[:,0,0],cov[:,1,1]],axis=1))
    for i in np.argsort(-position[:,2]):
        if position[i,2]<.05 or alpha[i]<.035:continue
        x0,y0=np.maximum(np.floor(pixel[i]-radius[i]).astype(int),0);x1,y1=np.minimum(np.ceil(pixel[i]+radius[i]).astype(int)+1,[width,height])
        if x1<=x0 or y1<=y0:continue
        yy,xx=np.mgrid[y0:y1,x0:x1];dx,dy=xx-pixel[i,0],yy-pixel[i,1];distance=inverse[i,0,0]*dx*dx+2*inverse[i,0,1]*dx*dy+inverse[i,1,1]*dy*dy;opacity=(np.exp(-distance/2)*alpha[i])[:,:,None]
        image[y0:y1,x0:x1]=image[y0:y1,x0:x1]*(1-opacity)+rgb[i]*opacity
    Image.fromarray(np.clip(image*255,0,255).astype('uint8')).save(out/f'{name}-adapted.png')
    print(name,'review saved',flush=True)
