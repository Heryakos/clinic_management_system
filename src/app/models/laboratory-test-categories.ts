export const testCategories = {
  Chemistry: [
    { name: 'FBS/RBS', normalRange: '70-100 mg/dL', unit: 'mg/dL' },
    { name: 'SGOT/AST', normalRange: '10-40 U/L', unit: 'U/L' },
    { name: 'SGPT/ALT', normalRange: '7-56 U/L', unit: 'U/L' },
    { name: 'ALK PHOS', normalRange: '44-147 U/L', unit: 'U/L' },
    { name: 'Bilirubin (T)', normalRange: '0.3-1.2 mg/dL', unit: 'mg/dL' },
    { name: 'Bilirubin (D)', normalRange: '0.0-0.3 mg/dL', unit: 'mg/dL' },
    { name: 'BUN', normalRange: '7-20 mg/dL', unit: 'mg/dL' },
    { name: 'Creatinine', normalRange: '0.6-1.2 mg/dL', unit: 'mg/dL' },
    { name: 'Uric acid', normalRange: '3.4-7.0 mg/dL', unit: 'mg/dL' },
    { name: 'Total Protein', normalRange: '6.0-8.3 g/dL', unit: 'g/dL' },
    // from this are the new
    { name: 'Triglyceride', normalRange: '0-150 mg/dL', unit: 'mg/dL' },
    { name: 'Cholesterol', normalRange: '0-220 mg/dL', unit: 'mg/dL' },
    { name: 'HDL - C', normalRange: '14-46 mg/dL', unit: 'mg/dL' },
    { name: 'LDL - C', normalRange: '60-150 mg/dL', unit: 'mg/dL' }

  ],
  Bacteriology: [
    { name: 'Sputum for AFB (1)', normalRange: 'Negative', unit: '' },
    { name: 'Sputum for AFB (2)', normalRange: 'Negative', unit: '' },
    { name: 'Sputum for AFB (3)', normalRange: 'Negative', unit: '' },
    { name: "Gram's Stain", normalRange: 'No gram reaction', unit: '' },
    { name: 'Culture & Sensitivity', normalRange: 'No growth', unit: '' },
    //from this are new
    { name: 'KOH', normalRange: 'No gram reaction', unit: '' },
    { name: 'Wet mount', normalRange: 'No T.vaginalis seen', unit: '' }

  ],
  Fluid_Analysis: [
    { name: 'WBC', normalRange: '4,000-11,000/μL', unit: '/μL' },
    { name: 'Protein', normalRange: '6.0-8.3 g/dL', unit: 'g/dL' },
    { name: 'Glucose', normalRange: '70-100 mg/dL', unit: 'mg/dL' },
    { name: "Gram's Stain", normalRange: 'No organisms seen', unit: '' }
  ],
  Hematology: [
    { name: 'Hemoglobin', normalRange: '12-16 g/dL', unit: 'g/dL' },
    { name: 'Hematocrit', normalRange: '36-48%', unit: '%' },
    { name: 'RBC Count', normalRange: '4.2-5.4 million/μL', unit: 'million/μL' },
    // this the new
    { name: 'CBC & Differential', normalRange: '4.0-10.0 /L', unit: '/L' },
    { name: 'WBC', normalRange: '3.5-5.5 /L', unit: '/L' },
    { name: 'GRA', normalRange: '40-75%', unit: '%' },
    { name: 'LYM', normalRange: '45-70 %', unit: '%' },
    { name: 'BASO', normalRange: '0-1 %', unit: '%' },
    { name: 'PLT', normalRange: '10^6/L', unit: '/L' },
    { name: 'MON', normalRange: '2-10 %', unit: '%' },
    { name: 'MCV', normalRange: '80- 98', unit: 'EL' },
    { name: 'MCH', normalRange: '27-32', unit: 'pg' },
    { name: 'MCHC', normalRange: '23.2-38.7', unit: 'g/dl' },
    // they should be sub child
    { name: 'ESR', normalRange: '0-15', unit: 'mm/hr' },
    { name: 'Bloodfilm', normalRange: 'negative', unit: '' }
  ],
  Serology: [
    { name: 'HIV Test', normalRange: 'Negative', unit: '' },
    { name: 'HBsAg', normalRange: 'Negative', unit: '' },
    { name: 'HCV Test', normalRange: 'Negative', unit: '' },
    { name: 'Widal test SH', normalRange: 'NR', unit: '' },
    { name: 'Widal test SO', normalRange: 'NR', unit: '' },
    { name: 'Weil Fliex (0X19)', normalRange: 'NR', unit: '' },
    { name: 'VDRL/RPR', normalRange: 'NR', unit: '' },
    { name: 'Blood Group & Rh factory', normalRange: '', unit: '' },
    { name: 'H.Pylori AB', normalRange: 'Negative', unit: '' },
    { name: 'H.Pylori AG', normalRange: 'Negative', unit: '' },
    { name: 'ASO', normalRange: 'NR', unit: '' },
    { name: 'RF', normalRange: 'NR', unit: '' },
    { name: 'HCG test', normalRange: 'Negative', unit: '' },
    { name: 'ASO', normalRange: 'NR', unit: '' },
    { name: 'other', normalRange: '', unit: '' }
  ],

  // from this are new
  UrineAnalysis:[
    { name: 'Color', normalRange: 'Amber/Yellow', unit: '' },
    { name: 'Appearance', normalRange: 'Clear', unit: '' },
    { name: 'PH', normalRange: '5-8', unit: '' },
    { name: 'Specific gravity', normalRange: '1.005-1.025', unit: '' },
    { name: 'Blood', normalRange: 'Negative', unit: '' },
    { name: 'Bilirubin', normalRange: 'Negative', unit: '' },
    { name: 'Uro-bilinogen', normalRange: 'Negative', unit: '' },
    { name: 'Protine', normalRange: 'Negative', unit: '' },
    { name: 'Nitrite', normalRange: 'Negative', unit: '' },
    { name: 'Léukocyte', normalRange: 'Negative', unit: '' },
    { name: 'Glucose', normalRange: 'Negative', unit: '' },
    { name: 'Ketone', normalRange: 'Negative', unit: '' },
    //this is a child microscoip
    { name: 'WBC', normalRange: '0-4/HPF', unit: '/HPF' },
    { name: 'RBC', normalRange: '0-3?HPF', unit: '/HPF' },
    { name: 'Epith.cell', normalRange: '2-4/LPF', unit: '/LPF' },
    //this is a pregnacy
    { name: 'Other', normalRange: '', unit: '' },
    { name: 'Pregenancy Test', normalRange: 'Negative', unit: '' }

  ],
  HormonTest:[
    { name: 'T3', normalRange: '0.61-9.22 nmol/L', unit: '/nmol/L' },
    { name: 'T4', normalRange: '12.87-300 nmol/L', unit: '/nmol/L' },
    { name: 'TSH', normalRange: '0.1-100 mIUl\L', unit: '/mIUl\L' },
    { name: 'CRP', normalRange: '0.5-200 mg/L', unit: 'mg\L' },
    { name: 'HbA1C', normalRange: '4.0-14.5 %', unit: '%' },
    { name: 'CTNI/Troponin', normalRange: '0.1-50 ng/mL', unit: 'ng/mL' },
    { name: 'CKMB', normalRange: '0.3-100 ng/mL', unit: 'ng\mL' },
    { name: 'PSA', normalRange: '2-100 ng/mL', unit: 'ng/mL' }
  ],
  Stool_Examination:[
    { name: 'Color', normalRange: 'Brown', unit: '' },
    { name: 'Consitancy', normalRange: 'Soft', unit: '' },
    { name: 'Ova & Parasite', normalRange: 'No O/p', unit: '' }
  ]
}; 