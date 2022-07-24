import { roundValueForPresentation as r } from 'cad/craft/operationHelper';
import { MFace } from "cad/model/mface";
import { ApplicationContext } from "context";
import { EntityKind } from "cad/model/entities";
import { BooleanDefinition, BooleanKind } from "cad/craft/schema/common/BooleanDefinition";
import Axis from "math/axis";
import { OperationDescriptor } from "cad/craft/operationPlugin";

interface smFlangeParams {
  angle: number;
  face: MFace;
  flip: boolean;

}

export const smFlangeOperation: OperationDescriptor<smFlangeParams> = {
  id: 'SM_FLANGE',
  label: 'Flange',
  icon: 'img/cad/smFlange',
  info: 'Creates Sheet metal flange',
  paramsInfo: ({ angle }) => `(${r(angle)})`,
  run: (params: smFlangeParams, ctx: ApplicationContext) => {
    console.log(params);
    let occ = ctx.occService;
    const oci = occ.commandInterface;

    const face = params.face;

    let occFaces = [face];
    let revolveVector;
    let revolveVectorOrigin;
    let revolveVectorDirection;

    for (let i = 0; i < face.edges.length; i++) {
      const edgeKind = face.edges[i].productionInfo.sheetMetal.kind;
      console.log(edgeKind);
      if (edgeKind == "FLAT/A" && !params.flip) {
        revolveVector = face.edges[i].toAxis();
        revolveVectorOrigin = revolveVector.origin;
        revolveVectorDirection = revolveVector.direction.negate();
        revolveVectorOrigin.z -=2;
      }
      if (edgeKind == "FLAT/B" && params.flip) {
        revolveVector = face.edges[i].toAxis();
        revolveVectorOrigin = revolveVector.origin;
        revolveVectorDirection = revolveVector.direction;
        revolveVectorOrigin.z +=2;
      }
    }

    console.log(revolveVectorOrigin);
    //revolveVectorOrigin.y -=0;
    //revolveVectorOrigin.z +=2;

    const tools = occFaces.map((faceName, i) => {
      const shapeName = "Tool/" + i;
      const args = [shapeName, faceName, ...params.axis.origin.data(), ...params.axis.direction.negate().data(), params.angle];
      oci.revol(...args);

      return shapeName;
    }).map(shapeName => occ.io.getShell(shapeName));

    const booleanOperation = {
      kind: "UNION",
      targets: [params.face.shell]
    }

    console.log(params.face.shell);

    tools[0].edges.forEach(async (newEdge) => {
      params.face.shell.edges.forEach(async (edgeToLookAt) => {
        if (JSON.stringify(newEdge.topology.data.tessellation) == JSON.stringify(edgeToLookAt.topology.data.tessellation)) {
          console.log("We have a match", edgeToLookAt.productionInfo.sheetMetal.kind);
          newEdge.productionInfo ={};
          newEdge.productionInfo = { sheetMetal: { kind: edgeToLookAt.productionInfo.sheetMetal.kind } };
          //newEdge.productionInfo.sheetMetal.kind = edgeToLookAt.productionInfo.sheetMetal.kind;
          console.log(newEdge, edgeToLookAt);
          console.log(newEdge.productionInfo);
        }
      });
    });

    const  booleanOperation =   {
      kind: "UNION",
      targets:[params.face.shell]
    }
    
    return occ.utils.applyBooleanModifier(tools, booleanOperation);

  },
  form: [
    {
      type: 'number',
      label: 'angle',
      name: 'angle',
      defaultValue: 90,
    },
    {
      type: 'selection',
      name: 'face',
      capture: face => face.TYPE === EntityKind.FACE && face.productionInfo?.sheetMetal?.kind === 'THICKNESS',
      label: 'face',
      multi: false,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },
    {
      type: 'checkbox',
      label: 'Flip Direction',
      name: 'flip',
      defaultValue: false,
    },
  ],
}
