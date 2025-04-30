export type TOnedriveMe = {
  '@odata.context': string;
  userPrincipalName: string;
  id: string;
  displayName: string;
  surname: string;
  givenName: string;
  preferredLanguage: string;
  mail: string;
  mobilePhone?: string;
  jobTitle?: string;
  officeLocation?: string;
  businessPhones?: string[];
};
