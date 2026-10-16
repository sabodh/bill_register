import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { formatBillPdfDateTime } from '../../billing/pdf/billPdfFormat';
import type {
  LabResultPdfRow,
  LabResultPdfSection,
  LabResultPdfSnapshot,
  LabResultPdfTest,
} from './labResultPdfTypes';

function testsInReportOrder(sections: LabResultPdfSection[]): LabResultPdfTest[] {
  const tests: LabResultPdfTest[] = [];
  for (const section of sections) {
    if (section.tests.length > 0) {
      tests.push(...section.tests);
    }
  }
  return tests;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    paddingBottom: 10,
  },
  hospital: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    color: '#595959',
  },
  metaGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: { width: '47%' },
  label: { color: '#8c8c8c', fontSize: 8, marginBottom: 2 },
  value: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  resultsBlock: { marginTop: 8 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 10,
    color: '#262626',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    paddingTop: 4,
    paddingBottom: 8,
    marginBottom: 8,
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
    paddingTop: 8,
  },
  methodRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  testEntry: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d9d9d9',
  },
  testBlock: { marginBottom: 10 },
  colName: { width: '48%', paddingRight: 10 },
  colResult: { width: '17%', paddingLeft: 14, paddingRight: 4 },
  colResultValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  colRef: { width: '35%', textAlign: 'right', fontSize: 9, paddingTop: 1 },
  headerText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#595959' },
  headerRefText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#595959', textAlign: 'right' },
  testName: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  panelTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  subtestName: { paddingLeft: 14, fontSize: 10, fontFamily: 'Helvetica' },
  resultValue: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  unitText: { fontSize: 9, color: '#595959' },
  methodText: {
    fontSize: 9,
    color: '#434343',
    marginTop: 2,
  },
  testHeading: { paddingTop: 4, marginBottom: 6 },
  interpretation: {
    marginTop: 3,
    marginBottom: 6,
    paddingLeft: 4,
    fontSize: 9,
    color: '#434343',
    fontStyle: 'italic',
  },
  signOff: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d9d9d9',
  },
  signOffLine: { marginTop: 16, fontSize: 9 },
  footerNote: { marginTop: 8, fontSize: 8, color: '#8c8c8c' },
});

function ColumnHeader() {
  return (
    <View style={styles.tableHeader}>
      <View style={styles.colName}>
        <Text style={styles.headerText}>Test name</Text>
      </View>
      <View style={styles.colResult}>
        <Text style={styles.headerText}>Result</Text>
      </View>
      <View style={styles.colRef}>
        <Text style={styles.headerRefText}>Biological reference range</Text>
      </View>
    </View>
  );
}

function ResultUnitCell({ result, unit }: { result: string; unit: string }) {
  const display = result || '—';
  return (
    <View style={styles.colResult}>
      <View style={styles.colResultValues}>
        <Text style={styles.resultValue}>{display}</Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function RefCell({ reference }: { reference: string }) {
  const lines = reference ? reference.split('\n') : ['—'];
  return (
    <View style={styles.colRef}>
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </View>
  );
}

function MethodLine({ methodName }: { methodName: string }) {
  const trimmed = methodName.trim();
  if (!trimmed) {
    return null;
  }
  return <Text style={styles.methodText}>Method: {trimmed}</Text>;
}

function ResultRow({ row, showDivider = true }: { row: LabResultPdfRow; showDivider?: boolean }) {
  return (
    <View
      style={[
        styles.tableRow,
        styles.tableRowMain,
        showDivider ? styles.tableRowDivider : undefined,
        { paddingBottom: 8 },
      ]}
    >
      <Text
        style={[
          styles.colName,
          row.isSubtest ? styles.subtestName : styles.testName,
        ]}
      >
        {row.name}
      </Text>
      <ResultUnitCell result={row.result} unit={row.unit} />
      <RefCell reference={row.reference} />
    </View>
  );
}

function TestBlock({ test, isLastTest }: { test: LabResultPdfTest; isLastTest: boolean }) {
  return (
    <View style={styles.testBlock}>
      {test.isPanel ? (
        <>
          <View style={styles.testHeading}>
            <Text style={styles.panelTitle}>{test.title}</Text>
            <MethodLine methodName={test.methodName} />
          </View>
          {test.rows.map((row, index) => (
            <ResultRow
              key={index}
              row={row}
              showDivider={!isLastTest || index < test.rows.length - 1}
            />
          ))}
        </>
      ) : (
        test.rows.map((row, index) => (
          <View key={index} style={isLastTest ? undefined : styles.testEntry}>
            <View style={styles.tableRowMain}>
              <Text style={[styles.colName, styles.testName]}>{row.name}</Text>
              <ResultUnitCell result={row.result} unit={row.unit} />
              <RefCell reference={row.reference} />
            </View>
            <View style={styles.methodRow}>
              <View style={styles.colName}>
                <MethodLine methodName={test.methodName} />
              </View>
              <View style={styles.colResult} />
              <View style={styles.colRef} />
            </View>
          </View>
        ))
      )}
      {test.interpretation ? (
        <Text style={styles.interpretation}>Note: {test.interpretation}</Text>
      ) : null}
    </View>
  );
}

export function LabResultPdfDocument({ snapshot }: { snapshot: LabResultPdfSnapshot }) {
  const orderedTests = testsInReportOrder(snapshot.sections);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.hospital}>{snapshot.hospital_name}</Text>
          <Text style={styles.title}>Laboratory Report</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Patient</Text>
              <Text style={styles.value}>{snapshot.patient.name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>UHID / ID</Text>
              <Text style={styles.value}>{snapshot.patient.uhid}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Age / Sex</Text>
              <Text style={styles.value}>{snapshot.patient.ageSex}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{snapshot.patient.phone}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Bill no.</Text>
              <Text style={styles.value}>{snapshot.bill_number}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Referred by</Text>
              <Text style={styles.value}>{snapshot.doctor_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Sample collected</Text>
              <Text style={styles.value}>{formatBillPdfDateTime(snapshot.sample_collected_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Report date</Text>
              <Text style={styles.value}>{formatBillPdfDateTime(snapshot.reported_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultsBlock}>
          {snapshot.sections.some((section) => section.tests.length > 0) ? (
            <ColumnHeader />
          ) : null}
          {(() => {
            let testIndex = 0;
            return snapshot.sections
              .filter((section) => section.tests.length > 0)
              .map((section) => (
                <View key={section.departmentName} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.departmentName}</Text>
                  {section.tests.map((test) => {
                    const isLastTest = testIndex === orderedTests.length - 1;
                    testIndex += 1;
                    return (
                      <TestBlock
                        key={`${test.title}-${test.testCode}-${testIndex}`}
                        test={test}
                        isLastTest={isLastTest}
                      />
                    );
                  })}
                </View>
              ));
          })()}
        </View>

        <View style={styles.signOff}>
          <Text style={styles.footerNote}>
            Biological reference ranges are for clinical correlation only. This report was generated
            electronically.
          </Text>
          <Text style={styles.signOffLine}>Authorized signatory: _______________________________</Text>
          <Text style={styles.signOffLine}>Designation: Pathologist / Lab director</Text>
        </View>
      </Page>
    </Document>
  );
}
