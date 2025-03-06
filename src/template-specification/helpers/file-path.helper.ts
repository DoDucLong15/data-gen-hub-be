export const DefaultFolterTemplateSpecification = 'template-specification';

export function getFilePath(
  classId: string,
  name: string,
  action: string,
  type: string,
  ext: string,
): string {
  return `data-gen-hub/${classId}/${name}/${action}/${type}_${action}.${ext}`;
}
