#!/usr/bin/env python3
"""Local CPU Gaussian previews; numpy and Pillow, no browser or upload.

python3 scripts/figure/splat_review.py
These orthographic renders check the crop, not the house's WebGL pipeline.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from splat import ROOT, read_ply, values, colour, crop

def xyz(a): return values(a, 'xyz')
def cols(a): return colour(a)

def render(a,path,eye,target,size=900,span=2):
 p=xyz(a);c=cols(a);alpha=1/(1+np.exp(-a['opacity']))
 eye=np.array(eye);f=np.array(target)-eye;f/=np.linalg.norm(f);r=np.cross(f,[0,-1,0]);r/=np.linalg.norm(r);u=np.cross(r,f);R=np.stack([r,-u,f]);v=(p-np.array(target))@R.T;px=v[:,:2]*size/span+size/2
 q=np.stack([a[f'rot_{i}'] for i in range(4)],1);q/=np.linalg.norm(q,axis=1)[:,None];w,x,y,z=q.T
 rot=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]).transpose(2,0,1)
 sc=np.exp(np.stack([a[f'scale_{i}'] for i in range(3)],1));M=(R[None]@rot)*sc[:,None,:]*size/span;cov=(M@M.transpose(0,2,1))[:,:2,:2]+np.eye(2)*.25
 inv=np.linalg.inv(cov);rad=3*np.sqrt(np.stack([cov[:,0,0],cov[:,1,1]],1));im=np.ones((size,size,3),dtype=np.float32)*.16
 for i in np.argsort(-v[:,2]):
  if alpha[i]<.05:continue
  x0,y0=np.maximum(np.floor(px[i]-rad[i]).astype(int),0);x1,y1=np.minimum(np.ceil(px[i]+rad[i]).astype(int)+1,size)
  if x1<=x0 or y1<=y0:continue
  yy,xx=np.mgrid[y0:y1,x0:x1];dx=xx-px[i,0];dy=yy-px[i,1];d=inv[i,0,0]*dx*dx+2*inv[i,0,1]*dx*dy+inv[i,1,1]*dy*dy
  op=(np.exp(-d*.5)*alpha[i])[:,:,None];im[y0:y1,x0:x1]=im[y0:y1,x0:x1]*(1-op)+c[i]*op
 Image.fromarray(np.clip(im*255,0,255).astype('uint8')).save(path)
if __name__ == '__main__':
    out = ROOT / 'review/polish/snaps/splat'
    out.mkdir(parents=True, exist_ok=True)
    eyes = [[2,-1,-3],[-2,-1,-3],[2,-1,3],[-2,-1,3]]
    for take in [121, 122]:
        a = read_ply(ROOT / f'assets/figure/scan/take-{take}.ply')
        p = xyz(a)
        scales = np.exp(values(a, ['scale_0','scale_1','scale_2']))
        core = a[(np.abs(p)<1.25).all(1) & (a['opacity']>-2) & (scales.max(axis=1)<.05)]
        for i, eye in enumerate(eyes):
            render(core, out / f'cpu-{take}-{i}.png', eye, [-.3,.1,0])
        if take == 122:
            for i, eye in enumerate(eyes):
                render(crop(a), out / f'crop-{i}.png', eye, [0,.05,.15], size=800, span=1.05)
