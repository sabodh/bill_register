import type { LabTestCategory } from '../../api/types/models';

export function getRangeSectionMeta(testCategory: LabTestCategory) {
  switch (testCategory) {
    case 'SPECIAL':
      return {
        showSection: false,
        title: '',
        hint: '',
        textColumn: '',
        addLabel: '',
        showLabelColumn: false,
        allowMultipleRows: false,
      };
    case 'SUBTEST':
      return {
        showSection: true,
        title: 'Subtests (panel)',
        hint:
          'Each row is one line on the result screen (e.g. Neutrophils, Lymphocytes). Staff enter only the Result column.',
        textColumn: 'Subtest name',
        addLabel: 'Add subtest',
        showLabelColumn: true,
        allowMultipleRows: true,
      };
    case 'MULTIPLE_REFERENCE':
      return {
        showSection: true,
        title: 'Reference by category',
        hint:
          'One analysed value on the result screen; show Male / Female (or other) reference lines on the report.',
        textColumn: 'Category',
        addLabel: 'Add category',
        showLabelColumn: true,
        allowMultipleRows: true,
      };
    case 'NORMAL':
      return {
        showSection: true,
        title: 'Reference range',
        hint: 'Single-value test (e.g. Blood glucose 120 mg/dL). Staff enter the analysed result only.',
        textColumn: '',
        addLabel: 'Add row',
        showLabelColumn: false,
        allowMultipleRows: false,
      };
    default:
      return {
        showSection: true,
        title: 'Reference values',
        hint: 'Define how this test appears on result entry and PDF.',
        textColumn: 'Label',
        addLabel: 'Add row',
        showLabelColumn: true,
        allowMultipleRows: true,
      };
  }
}
