import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { formatBillPdfDateTime } from '../../billing/pdf/billPdfFormat';
import {
  formatDoctorForReport,
  formatPatientNameWithAgeGender,
  isHospitalNamePresent,
} from './labResultPdfVisitFormat';
import type { LabResultPdfRenderOptions } from './labResultPdfRender';
import { DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS } from './labResultPdfRender';
import type {
  LabResultPdfRow,
  LabResultPdfSection,
  LabResultPdfSnapshot,
  LabResultPdfTest,
} from './labResultPdfTypes';

import { LETTERPAD_BAND_HEIGHT_PT } from './labResultLetterheadLayout';

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
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    paddingBottom: 3,
  },
  visitBlock: {
    fontSize: 9,
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
    fontSize: 9,
  },
  visitLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#434343',
  },
  resultsBlock: { marginTop: 4 },
  section: { marginTop: 12 },
  sectionFirst: { marginTop: 0 },
  sectionFirstSpaced: { marginTop: 6 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
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
  colRef: { width: '35%', textAlign: 'right', fontSize: 9, paddingTop: 0 },
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
    marginTop: 0,
  },
  testHeading: { paddingTop: 2, marginBottom: 4 },
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
    fontFamily: 'Helvetica-Bold',
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

function VisitDetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.visitLine} wrap={false}>
      <Text style={styles.visitLabel}>{label}</Text>
      {value}
    </Text>
  );
}

function VisitDetailsBlock({
  snapshot,
  renderOptions,
}: {
  snapshot: LabResultPdfSnapshot;
  renderOptions: LabResultPdfRenderOptions;
}) {
  const patientLine = formatPatientNameWithAgeGender(
    snapshot.patient.name,
    snapshot.patient.age_years,
    snapshot.patient.gender,
  );
  const doctorLine = formatDoctorForReport(snapshot.doctor_name);
  const showHospital =
    renderOptions.includeHospitalName && isHospitalNamePresent(snapshot.hospital_name);
  const showSample = renderOptions.includeSampleCollectionTime;
  const reportOn = formatBillPdfDateTime(snapshot.reported_at);
  const showThirdRow = showHospital || showSample;

  return (
    <View style={[styles.visitBlock, styles.visitBlockAfterLetterhead]}>
      <View style={styles.visitRow}>
        <View style={styles.visitCol}>
          <VisitDetailLine label="Patient name: " value={patientLine} />
        </View>
        <View style={styles.visitColRight}>
          {showSample ? (
            <VisitDetailLine
              label="Sample collected: "
              value={formatBillPdfDateTime(snapshot.sample_collected_at)}
            />
          ) : (
            <VisitDetailLine label="Report on: " value={reportOn} />
          )}
        </View>
      </View>
      <View style={styles.visitRow}>
        <View style={styles.visitCol}>
          <VisitDetailLine label="Ref.Doctor: " value={doctorLine} />
        </View>
        <View style={styles.visitColRight}>
          {showSample ? (
            <VisitDetailLine label="Report on: " value={reportOn} />
          ) : (
            <VisitDetailLine label="Bill no: " value={snapshot.bill_number} />
          )}
        </View>
      </View>
      {showThirdRow ? (
        <View style={styles.visitRow}>
          <View style={styles.visitCol}>
            {showHospital ? (
              <VisitDetailLine label="Hospital: " value={snapshot.hospital_name.trim()} />
            ) : null}
          </View>
          <View style={styles.visitColRight}>
            {showSample ? <VisitDetailLine label="Bill no: " value={snapshot.bill_number} /> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BuiltInSampleLetterhead() {
  return (
    <View>
      <Text style={styles.sampleLetterheadTitle}>Sample Hospital & Laboratory</Text>
      <Text style={styles.sampleLetterheadSub}>
        123 Health Street · Sample City · +91 00000 00000
      </Text>
      <View style={styles.sampleLetterheadRule}>
        <Text style={styles.sampleLetterheadHint}>
          Sample letterhead — replace via Branch → Report letterhead in admin
        </Text>
      </View>
    </View>
  );
}

function LetterheadBand({
  imageSrc,
  useBuiltInSample,
  showImage,
  bandHeightPt,
}: {
  imageSrc: string | null;
  useBuiltInSample: boolean;
  showImage: boolean;
  bandHeightPt: number;
}) {
  return (
    <View style={[styles.letterheadBand, { height: bandHeightPt }]}>
      {showImage && imageSrc ? (
        <Image src={imageSrc} style={[styles.letterheadImage, { height: bandHeightPt }]} />
      ) : null}
      {showImage && !imageSrc && useBuiltInSample ? <BuiltInSampleLetterhead /> : null}
    </View>
  );
}

function ColumnHeader({
  includeReportDividers,
  includeSpaceBeforeDepartment,
  tightDepartmentTopSpacing,
}: {
  includeReportDividers: boolean;
  includeSpaceBeforeDepartment: boolean;
  tightDepartmentTopSpacing: boolean;
}) {
  return (
    <View
      style={[
        styles.tableHeader,
        !includeReportDividers ? styles.tableHeaderTopRule : undefined,
        includeSpaceBeforeDepartment ? styles.tableHeaderSpacedBelow : undefined,
        tightDepartmentTopSpacing ? styles.tableHeaderTightBelow : undefined,
      ]}
    >
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

function ResultRow({
  row,
  showDivider = true,
  includeReportDividers,
}: {
  row: LabResultPdfRow;
  showDivider?: boolean;
  includeReportDividers: boolean;
}) {
  return (
    <View
      style={[
        styles.tableRow,
        styles.tableRowMain,
        showDivider && includeReportDividers ? styles.tableRowDivider : undefined,
        { paddingBottom: 4 },
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

function TestBlock({
  test,
  isLastTest,
  includeMethodLines,
  includeInterpretation,
  includeReportDividers,
}: {
  test: LabResultPdfTest;
  isLastTest: boolean;
  includeMethodLines: boolean;
  includeInterpretation: boolean;
  includeReportDividers: boolean;
}) {
  return (
    <View style={styles.testBlock}>
      {test.isPanel ? (
        <>
          <View style={styles.testHeading}>
            <Text style={styles.panelTitle}>{test.title}</Text>
            {includeMethodLines ? <MethodLine methodName={test.methodName} /> : null}
          </View>
          {test.rows.map((row, index) => (
            <ResultRow
              key={index}
              row={row}
              showDivider={!isLastTest || index < test.rows.length - 1}
              includeReportDividers={includeReportDividers}
            />
          ))}
        </>
      ) : (
        test.rows.map((row, index) => (
          <View
            key={index}
            style={!isLastTest && includeReportDividers ? styles.testEntry : undefined}
          >
            <View
              style={[
                styles.tableRowMain,
                includeMethodLines ? styles.tableRowMainWithMethod : undefined,
              ]}
            >
              <Text style={[styles.colName, styles.testName]}>{row.name}</Text>
              <ResultUnitCell result={row.result} unit={row.unit} />
              <RefCell reference={row.reference} />
            </View>
            {includeMethodLines ? (
              <View style={styles.methodRow}>
                <View style={styles.colName}>
                  <MethodLine methodName={test.methodName} />
                </View>
                <View style={styles.colResult} />
                <View style={styles.colRef} />
              </View>
            ) : null}
          </View>
        ))
      )}
      {includeInterpretation && test.interpretation ? (
        <Text style={styles.interpretation}>Note: {test.interpretation}</Text>
      ) : null}
    </View>
  );
}

export function LabResultPdfDocument({
  snapshot,
  renderOptions = DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
  letterheadImageSrc = null,
  useBuiltInSampleLetterhead = false,
  letterheadBandHeightPt = LETTERPAD_BAND_HEIGHT_PT,
}: {
  snapshot: LabResultPdfSnapshot;
  renderOptions?: LabResultPdfRenderOptions;
  letterheadImageSrc?: string | null;
  useBuiltInSampleLetterhead?: boolean;
  letterheadBandHeightPt?: number;
}) {
  const orderedTests = testsInReportOrder(snapshot.sections);
  const showSignOff =
    renderOptions.includeFooterDisclaimer ||
    renderOptions.includeAuthorizedSignature ||
    renderOptions.includePathologistDesignation;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <LetterheadBand
          imageSrc={letterheadImageSrc}
          useBuiltInSample={useBuiltInSampleLetterhead}
          showImage={renderOptions.includeLetterhead}
          bandHeightPt={letterheadBandHeightPt}
        />
        <View
          style={[
            styles.header,
            !renderOptions.includeReportDividers ? styles.headerPlain : undefined,
          ]}
        >
          <VisitDetailsBlock snapshot={snapshot} renderOptions={renderOptions} />
        </View>

        <View style={styles.resultsBlock}>
          {snapshot.sections.some((section) => section.tests.length > 0) ? (
            <ColumnHeader
              includeReportDividers={renderOptions.includeReportDividers}
              includeSpaceBeforeDepartment={renderOptions.includeSpaceBeforeDepartment}
              tightDepartmentTopSpacing={renderOptions.tightDepartmentTopSpacing}
            />
          ) : null}
          {(() => {
            let testIndex = 0;
            const sectionsWithTests = snapshot.sections.filter((section) => section.tests.length > 0);
            return sectionsWithTests.map((section, sectionIndex) => (
                <View
                  key={section.departmentName}
                  style={[
                    styles.section,
                    sectionIndex === 0
                      ? renderOptions.includeSpaceBeforeDepartment
                        ? styles.sectionFirstSpaced
                        : styles.sectionFirst
                      : undefined,
                  ]}
                >
                  {renderOptions.includeDepartmentHeadings ? (
                    <Text
                      style={[
                        styles.sectionTitle,
                        !renderOptions.departmentHeadingShaded ? styles.sectionTitlePlain : undefined,
                        renderOptions.tightDepartmentTopSpacing ? styles.sectionTitleTightTop : undefined,
                        renderOptions.spaciousDepartmentHeading
                          ? styles.sectionTitleSpacious
                          : undefined,
                      ]}
                    >
                      {section.departmentName}
                    </Text>
                  ) : null}
                  {section.tests.map((test) => {
                    const isLastTest = testIndex === orderedTests.length - 1;
                    testIndex += 1;
                    return (
                      <TestBlock
                        key={`${test.title}-${test.testCode}-${testIndex}`}
                        test={test}
                        isLastTest={isLastTest}
                        includeMethodLines={renderOptions.includeMethodLines}
                        includeInterpretation={renderOptions.includeInterpretation}
                        includeReportDividers={renderOptions.includeReportDividers}
                      />
                    );
                  })}
                </View>
              ));
          })()}
        </View>

        {showSignOff ? (
          <View
            style={[
              styles.signOff,
              !renderOptions.includeReportDividers ? styles.signOffPlain : undefined,
            ]}
          >
            {renderOptions.includeFooterDisclaimer ? (
              <Text style={styles.footerNote}>
                Biological reference ranges are for clinical correlation only. This report was
                generated electronically.
              </Text>
            ) : null}
            {renderOptions.includeAuthorizedSignature ? (
              <Text style={styles.signOffLine}>
                Authorized signatory: _______________________________
              </Text>
            ) : null}
            {renderOptions.includePathologistDesignation ? (
              <Text style={styles.signOffLine}>Designation: Pathologist / Lab director</Text>
            ) : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
