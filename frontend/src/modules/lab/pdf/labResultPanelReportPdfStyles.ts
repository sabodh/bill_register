import { StyleSheet } from '@react-pdf/renderer';

import { labResultPdfFontFamilies, type LabResultPdfFontPreset } from './labResultPdfFonts';
import type { LabResultPdfTypography } from './labResultPdfTypography';

export function createLabResultPanelReportPdfStyles(
  fontPreset: LabResultPdfFontPreset,
  typography: LabResultPdfTypography,
) {
  const { regular, bold } = labResultPdfFontFamilies(fontPreset);
  const t = typography;
  return StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontSize: t.body,
    fontFamily: regular,
    color: '#1a1a1a',
  },
  departmentTitle: {
    fontFamily: bold,
    fontSize: t.department,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  panelTitle: {
    fontFamily: bold,
    fontSize: t.testName,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  singleTestTitle: {
    fontFamily: bold,
    fontSize: t.testName,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d9d9d9',
  },
  colTest: { width: '42%', paddingRight: 6 },
  colValue: { width: '18%', fontFamily: bold, fontSize: t.result },
  colUnit: { width: '14%', fontSize: t.body },
  colRef: { width: '26%', textAlign: 'right', fontSize: t.reference },
  headerCell: { fontFamily: bold, fontSize: t.tableHeader },
  narrativeBlock: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: t.interpretation,
    lineHeight: 1.35,
    color: '#333',
  },
  narrativeHeading: {
    fontFamily: bold,
    marginBottom: 4,
  },
  sectionGap: { marginBottom: 16 },
  endReport: {
    marginTop: 14,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: bold,
    fontSize: t.signOff,
  },
  patientHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    paddingBottom: 12,
    marginBottom: 14,
  },
  patientName: {
    fontFamily: bold,
    fontSize: t.department,
    marginBottom: 8,
  },
  patientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientColLeft: {
    width: '50%',
    paddingRight: 10,
  },
  patientColRight: {
    width: '40%',
    marginLeft: '10%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    width: 88,
    fontFamily: bold,
  },
  detailValue: { flex: 1 },
  signOff: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#d9d9d9',
  },
  signOffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  signOffCol: { width: '45%' },
  signOffLine: { marginTop: 8, fontSize: t.signOff },
  footerNote: { marginTop: 8, fontSize: t.footer, color: '#8c8c8c' },
});
}

export type LabResultPanelReportPdfStyles = ReturnType<typeof createLabResultPanelReportPdfStyles>;
