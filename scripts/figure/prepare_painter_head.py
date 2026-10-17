"""Fit only her captured head to the existing painting figure.

The scan's seated body is deliberately excluded. The painting body's pose,
hands, brush, stool and canvas contact are retained without changing a vertex.
"""
from pathlib import Path
import argparse,json
import numpy as np
from splat import ROOT,read_ply,values,colour,write_splat

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--scan',type=Path,required=True)
parser.add_argument('--out',type=Path,default=ROOT/'review/painter-head')
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
data=read_ply(args.scan);p=values(data,'xyz');rgb=colour(data)
# Keep the entire skull and hair. Below the jaw, keep the central neck only:
# neither the patterned shirt nor the scan's seated body belongs to this pose.
keep=(p[:,1]<.012)&(abs(p[:,0])<.18)&(p[:,2]<.14)
skin=(abs(p[:,0])<.073)&(p[:,2]<-.105)&(rgb[:,0]>.9*rgb[:,1])&(rgb[:,1]>1.03*rgb[:,2])
hair=(rgb.max(axis=1)<.24)&(p[:,1]<-.043)
keep&=(p[:,1]<-.06)|skin|hair
head=data[keep].copy();hp=values(head,'xyz')
fade=np.clip((.012-hp[:,1])/.018,0,1)
alpha=1/(1+np.exp(-np.clip(head['opacity'],-60,60)))*fade
head['opacity']=np.log(np.clip(alpha,1e-8,1-1e-7)/(1-np.clip(alpha,1e-8,1-1e-7)))
head=head[alpha>.035]
np.save(args.out/'head-source.npy',head)

# Similarity alignment measured against the original painter's facial landmarks.
# Source axes are +X right, -Y up, -Z face; the final gaze aims at brush contact.
scale=.9237259932654512
align=np.array([[.99588197,.08432742,.03328653],[-.08392212,.99638230,-.01339353],[-.03429555,.01054490,.99935610]])
offset=np.array([-.01321912,-.14436515,-.09044591])
center=np.array([1.8609015941619873,4.206266403198242,1.152358055114746])
face=np.array([-.3280900716781616,.944646418094635,.00034400905133225024]);face/=np.linalg.norm(face)
up=np.array([0.,0.,1.])-face*face[2];up/=np.linalg.norm(up)
side=np.cross(up,face);side/=np.linalg.norm(side)
frame=np.stack([side,up,face],axis=1)
blender_rotation=frame@align@np.diag([1.,-1.,-1.])
blender_position=center+frame@offset
to_three=np.array([[1.,0,0],[0,0,1],[0,-1,0]])
rotation=to_three@blender_rotation;position=to_three@blender_position
# Convert a proper rotation matrix to the quaternion expected by three.js.
from scipy.spatial.transform import Rotation
placement={'scale':scale,'rotation':Rotation.from_matrix(rotation).as_quat().tolist(),'position':position.tolist(),'blender_rotation':blender_rotation.tolist(),'blender_position':blender_position.tolist(),'head_center':center.tolist(),'gaze':face.tolist(),'neck_cut':-.09,'gaussians':len(head)}
(ROOT/'lib/room/dolly-head-placement.json').write_text(json.dumps(placement,indent=2)+'\n')
size=write_splat(head,ROOT/'public/art/figure/dolly-head.splat')
print(json.dumps({'head_gaussians':len(head),'bytes':size,'gaze_at_canvas':placement['gaze']}))
