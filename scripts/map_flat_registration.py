"""Align vector coordinates to the source; generated bitmaps remain untouched."""
import cv2
import numpy as np
from map_source_recovery import architectural_mask

def register_plan(source, generated_walls, frame=None):
    height,width=source.shape[:2]
    original=architectural_mask(source)
    mask=(cv2.resize(generated_walls,(width,height),interpolation=cv2.INTER_NEAREST) if frame is None
          else cv2.warpAffine(generated_walls,frame,(width,height),flags=cv2.INTER_NEAREST))
    ys,xs=np.where(mask>0)
    identity=np.eye(2,3,dtype=float)
    if not len(xs): return identity,{'accepted':False,'reason':'empty-wall-mask'}
    # Exclude other labelled plans outside the selected subplan's occupied box.
    roi=np.zeros_like(mask)
    margin=max(20,int(max(width,height)*.035))
    roi[max(0,ys.min()-margin):min(height,ys.max()+margin+1),max(0,xs.min()-margin):min(width,xs.max()+margin+1)]=1
    original[roi==0]=0
    if np.count_nonzero(original)<20: return identity,{'accepted':False,'reason':'insufficient-reference'}
    def measure(target):
        distance=cv2.distanceTransform((target==0).astype('uint8'),cv2.DIST_L2,3)
        return float(np.mean(distance[original>0]<8)),float(np.median(distance[original>0]))
    before,median=measure(mask)
    report={'accepted':False,'beforeCoverage':round(before,3),'afterCoverage':round(before,3),'medianDistance':round(median,2)}
    factor=min(.5,900/max(width,height))
    def smooth(m):return cv2.GaussianBlur(cv2.resize(m,None,fx=factor,fy=factor).astype('float32')/255,(11,11),0)
    try:
        score,warp=cv2.findTransformECC(smooth(original),smooth(mask),np.eye(2,3,dtype='float32'),cv2.MOTION_AFFINE,
                                       (cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,150,.00001))
    except cv2.error:
        return identity,report
    warp[:,2]/=factor
    matrix=cv2.invertAffineTransform(warp).astype(float)
    singular=np.linalg.svd(matrix[:,:2],compute_uv=False)
    corners=np.array([[0,0],[width,0],[width,height],[0,height]],float)
    shifted=corners@matrix[:,:2].T+matrix[:,2]
    bounded=singular.min()>.85 and singular.max()<1.15 and np.linalg.norm(shifted-corners,axis=1).max()<max(width,height)*.12
    aligned=cv2.warpAffine(mask,matrix,(width,height),flags=cv2.INTER_NEAREST)
    after,new_median=measure(aligned)
    report['candidate']={'correlation':round(float(score),3),'coverage':round(after,3),
                         'scales':[round(float(x),3) for x in singular],'bounded':bool(bounded)}
    confident=score>.55 or (score>.5 and after>.75 and after>before+.2)
    if confident and bounded and after>=before+.04 and after>.65:
        report.update(accepted=True,afterCoverage=round(after,3),medianDistance=round(new_median,2),correlation=round(float(score),3))
        return matrix,report
    return identity,report
