import { TemplateSpecificationEntity } from '../entities/template-specification.entity';
import { ActionEnum } from '../enums/action.enum';

export const DefaultTemplateSpecification: Partial<TemplateSpecificationEntity>[] = [
  {
    name: 'DSSV',
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/dssv/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/dssv/export/json_export.json',
  },
  {
    name: 'DSSV',
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/pgnv/import/json_import.json',
  },
  {
    name: 'PGNV',
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/pgnv/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/pgnv/export/json_export.json',
  },
  {
    name: 'PGNV',
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/pgnv/import/json_import.json',
  },
  {
    name: 'NXHD',
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/nxhd/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/nxhd/export/json_export.json',
  },
  {
    name: 'NXHD',
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/nxhd/import/json_import.json',
  },
  {
    name: 'NXPB',
    action: ActionEnum.EXPORT,
    templateFile: 'data-gen-hub/common/specification/nxpb/export/template_export.xlsx',
    jsonFile: 'data-gen-hub/common/specification/nxpb/export/json_export.json',
  },
  {
    name: 'NXPB',
    action: ActionEnum.IMPORT,
    jsonFile: 'data-gen-hub/common/specification/nxpb/import/json_import.json',
  },
];
