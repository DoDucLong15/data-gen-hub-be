import { TemplateSpecificationEntity } from '../entities/template-specification.entity';
import { ActionEnum } from '../enums/action.enum';

export const SpecificationNameEnum = {
  DSSV: 'DSSV',
  PGNV: 'PGNV',
  NXHD: 'NXHD',
  NXPB: 'NXPB',
};

export const DefaultTemplateSpecification: Partial<TemplateSpecificationEntity>[] = [
  {
    name: SpecificationNameEnum.DSSV,
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/dssv/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/dssv/export/json_export.json',
  },
  {
    name: SpecificationNameEnum.DSSV,
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/dssv/import/json_import.json',
  },
  {
    name: SpecificationNameEnum.PGNV,
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/pgnv/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/pgnv/export/json_export.json',
  },
  {
    name: SpecificationNameEnum.PGNV,
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/pgnv/import/json_import.json',
  },
  {
    name: SpecificationNameEnum.NXHD,
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/nxhd/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/nxhd/export/json_export.json',
  },
  {
    name: SpecificationNameEnum.NXHD,
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/nxhd/import/json_import.json',
  },
  {
    name: SpecificationNameEnum.NXPB,
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/nxpb/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/nxpb/export/json_export.json',
  },
  {
    name: SpecificationNameEnum.NXPB,
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/nxpb/import/json_import.json',
  },
];
