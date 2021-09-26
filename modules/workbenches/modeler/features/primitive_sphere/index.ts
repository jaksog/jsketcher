import { ApplicationContext } from 'context';
import { MBrepShell } from 'cad/model/mshell';
import { roundValueForPresentation as r } from 'cad/craft/operationHelper';
import { occ2brep } from 'cad/occ/occ2models';
import icon32 from './icon32.png';
import icon96 from './icon96.png';

export default {
    id: 'primitive_sphere',
    label: 'primitive_sphere',
    icon: {
        iconSet: {
            medium: {
                iconType: 'image',
                iconContent: icon32
            },
            large: {
                iconType: 'image',
                iconContent: icon96
            }
        },
    },
    info: 'primitive_sphere',
    mutualExclusiveFields: [],
    paramsInfo: ({ diameter }) => `(${r(diameter)} )`,
    run: ({ diameter, }, ctx: ApplicationContext) => {

        const oc = ctx.occService.occContext;

        const myLocation = new oc.gp_Pnt_3(0, 0, 0);
        const sphereCenterline = oc.gp.DZ();
        const sphereOrientationAndLocation = new oc.gp_Ax2_3(myLocation, sphereCenterline);


        let myBody = new oc.BRepPrimAPI_MakeSphere_1(diameter);
        //let myBody = new oc.BRepPrimAPI_Make

        const aRes = new oc.TopoDS_Compound();
        const aBuilder = new oc.BRep_Builder();
        aBuilder.MakeCompound(aRes);
        aBuilder.Add(aRes, myBody.Shape());



        const mobject = new MBrepShell(occ2brep(aRes, ctx.occService.occContext));
        return {
            consumed: [],
            created: [mobject]
        };
    },
    schema: {
        diameter: {
            type: 'number',
            defaultValue: 200,
            label: 'diameter'
        },
    }
}

