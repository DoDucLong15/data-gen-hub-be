export const DefaultFolterTemplateSpecification = 'template-specification';

export function getFilePath(originalname: string): string {
  return `${DefaultFolterTemplateSpecification}/${Date.now()}_${originalname}`;
}