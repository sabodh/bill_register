import { StyleSheet } from '@react-pdf/renderer';

import { labResultPdfFontFamilies, type LabResultPdfFontPreset } from './labResultPdfFonts';
import type { LabResultPdfTypography } from './labResultPdfTypography';

export function createLabResultStandardPdfStyles(
  fontPreset: LabResultPdfFontPreset,
  typography: LabResultPdfTypography,
) {
  const { regular, bold } = labResultPdfFontFamilies(fontPreset);
  const t = typography;
  return StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 20,
    fontSize: t.body,
    fontFamily: regular,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    paddingBottom: 3,
  },
  visitBlock: {
    fontSize: t.patient,
  },
  visitBlockAfterLetterhead: {
    marginTop: 10,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
  },
  visitCol: {
    width: '50%',
    paddingRight: 10,
  },
  visitColRight: {
    width: '40%',
    marginLeft: '10%',
    paddingRight: 0,
  },
  visitLine: {
    fontSize: t.patient,
  },
  visitLabel: {
    fontFamily: bold,
    color: '#434343',
  },
  resultsBlock: { marginTop: 4 },
  section: { marginTop: 12 },
  sectionFirst: { marginTop: 0 },
  sectionFirstSpaced: { marginTop: 6 },
  sectionTitle: {
    fontFamily: bold,
    fontSize: t.department,
    marginBottom: 4,
    color: '#262626',
    backgroundColor: '#f5f5f5',
    paddingVertical: 3,
    textAlign: 'center',
  },
  sectionTitlePlain: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingVertical: 3,
    marginBottom: 4,
  },
  sectionTitleSpacious: {
    paddingVertical: 5,
  },
  headerPlain: {
    borderBottomWidth: 0,
  },
  signOffPlain: {
    borderTopWidth: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 4,
  },
  tableHeaderSpacedBelow: {
    marginBottom: 6,
  },
  tableHeaderTightBelow: {
    marginBottom: 1,
  },
  sectionTitleTightTop: {
    marginTop: 0,
    paddingVertical: 3,
  },
  tableHeaderTopRule: {
    borderTopWidth: 1,
    borderTopColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tableRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d9d9d9',
  },
  tableRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  tableRowMainWithMethod: {
    paddingBottom: 2,
  },
  methodRow: {
    flexDirection: 'row',
    paddingTop: 0,
    paddingBottom: 4,
  },
  testEntry: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d9d9d9',
  },
  testBlock: { marginBottom: 10 },
  colName: { width: '48%', paddingRight: 10 },
  colResult: { width: '17%', paddingLeft: 14, paddingRight: 4 },
  colResultValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  colRef: { width: '35%', textAlign: 'right', fontSize: t.reference, paddingTop: 0 },
  headerText: { fontFamily: bold, fontSize: t.tableHeader, color: '#595959' },
  headerRefText: { fontFamily: bold, fontSize: t.tableHeader, color: '#595959', textAlign: 'right' },
  testName: { fontFamily: bold, fontSize: t.testName },
  panelTitle: { fontFamily: bold, fontSize: t.testName },
  subtestName: { paddingLeft: 14, fontSize: t.testName, fontFamily: regular },
  resultValue: { fontFamily: bold, fontSize: t.result },
  unitText: { fontSize: t.reference, color: '#595959' },
  methodText: {
    fontSize: t.method,
    color: '#434343',
    marginTop: 0,
  },
  testHeading: { paddingTop: 2, marginBottom: 4 },
  interpretation: {
    marginTop: 3,
    marginBottom: 6,
    paddingLeft: 4,
    fontSize: t.interpretation,
    color: '#434343',
    fontStyle: 'italic',
  },
  signOff: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d9d9d9',
  },
  signOffLine: { marginTop: 16, fontSize: t.signOff },
  footerNote: { marginTop: 8, fontSize: t.footer, color: '#8c8c8c' },
  letterheadBand: {
    width: '100%',
    marginBottom: 0,
  },
  letterheadImage: {
    width: '100%',
    objectFit: 'contain',
    objectPosition: 'top center',
  },
  sampleLetterheadTitle: {
    fontFamily: bold,
    fontSize: 16,
    color: '#1a365d',
    textAlign: 'center',
  },
  sampleLetterheadSub: {
    marginTop: 6,
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
  },
  sampleLetterheadHint: {
    marginTop: 10,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sampleLetterheadRule: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
  },
});
}

export type LabResultStandardPdfStyles = ReturnType<typeof createLabResultStandardPdfStyles>;
