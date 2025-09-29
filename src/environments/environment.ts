declare global {
  interface Window {
    _UserName: string;
    rootPath: string;
    formPath: string;
    rootPath2: string;
    rootLookupApiPath: string;
    rootApiPath: string;
    LetterReportPath: string;
    assetBasePath: string;
  }
}

export const environment = {
  production: false,
  rootPath: window.rootPath,
  formPath: window.formPath,
  rootPath2: window.rootPath2,
  rootLookupApiPath: window.rootLookupApiPath,
  rootApiPath: window.rootApiPath,
  // username: window._UserName,
  // username: '10506', // this is supervisor and doctor
  // username: 'C00066', // Laboratory
  // username: '10522',  // this is the Pharmacy
  username: 'C00113', // doctor
  // username: 'C00067', // patient
  // username: '11094', // patient
  // username: '10830', // cardroom
  phisicalPath: "./assets/i18n/",
  assetBasePath: window.assetBasePath || 'assets/',
  Lang: "10D04E8B-3361-E111-95D5-00E04C05559B",
  LetterReportPath: window.LetterReportPath,
};

  
// export const environment = {
//   production: false,
//   rootPath: (window as any)["rootPath"],
//   formPath: (window as any)["formPath"],
//   rootPath2: (window as any)["rootPath2"],
//   rootLookupApiPath: (window as any)["rootLookupApiPath"],
//   rootApiPath: (window as any)["rootApiPath"],
//   username: window["_UserName"],
//   username: (window as any)._UserName,
//   // username: '10506', // this is supervisor and doctor
//   // username: 'C00066', // Laboratory
//   // username: '10522',  // this is the Pharmacy
//   // username: 'C00113', // doctor
//   // username: 'C00067', // patient
//   // username: '10830', // cardroom
//   phisicalPath: "./assets/i18n/",
//   Lang: "10D04E8B-3361-E111-95D5-00E04C05559B",
//   LetterReportPath: (window as any)["LetterReportPath"],
// };
