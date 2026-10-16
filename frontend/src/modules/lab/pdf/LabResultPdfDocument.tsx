import { Document, Image, Page, Text, View } from '@react-pdf/renderer';

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
import {
  createLabResultStandardPdfStyles,
  type LabResultStandardPdfStyles,
} from './labResultStandardPdfStyles';
import { resolveLabResultPdfTypography } from './labResultPdfTypography';

let pdfStyles: LabResultStandardPdfStyles;

function testsInReportOrder(sections: LabResultPdfSection[]): LabResultPdfTest[] {
  const tests: LabResultPdfTest[] = [];
  for (const section of sections) {
    if (section.tests.length > 0) {
      tests.push(...section.tests);
    }
  }
  return tests;
}

function VisitDetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={pdfStyles.visitLine} wrap={false}>
      <Text style={pdfStyles.visitLabel}>{label}</Text>
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
    <View style={[pdfStyles.visitBlock, pdfStyles.visitBlockAfterLetterhead]}>
      <View style={pdfStyles.visitRow}>
        <View style={pdfStyles.visitCol}>
          <VisitDetailLine label="Patient name: " value={patientLine} />
        </View>
        <View style={pdfStyles.visitColRight}>
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
      <View style={pdfStyles.visitRow}>
        <View style={pdfStyles.visitCol}>
          <VisitDetailLine label="Ref.Doctor: " value={doctorLine} />
        </View>
        <View style={pdfStyles.visitColRight}>
          {showSample ? (
            <VisitDetailLine label="Report on: " value={reportOn} />
          ) : (
            <VisitDetailLine label="Bill no: " value={snapshot.bill_number} />
          )}
        </View>
      </View>
      {showThirdRow ? (
        <View style={pdfStyles.visitRow}>
          <View style={pdfStyles.visitCol}>
            {showHospital ? (
              <VisitDetailLine label="Hospital: " value={snapshot.hospital_name.trim()} />
            ) : null}
          </View>
          <View style={pdfStyles.visitColRight}>
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
      <Text style={pdfStyles.sampleLetterheadTitle}>Sample Hospital & Laboratory</Text>
      <Text style={pdfStyles.sampleLetterheadSub}>
        123 Health Street · Sample City · +91 00000 00000
      </Text>
      <View style={pdfStyles.sampleLetterheadRule}>
        <Text style={pdfStyles.sampleLetterheadHint}>
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
    <View style={[pdfStyles.letterheadBand, { height: bandHeightPt }]}>
      {showImage && imageSrc ? (
        <Image src={imageSrc} style={[pdfStyles.letterheadImage, { height: bandHeightPt }]} />
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
        pdfStyles.tableHeader,
        !includeReportDividers ? pdfStyles.tableHeaderTopRule : undefined,
        includeSpaceBeforeDepartment ? pdfStyles.tableHeaderSpacedBelow : undefined,
        tightDepartmentTopSpacing ? pdfStyles.tableHeaderTightBelow : undefined,
      ]}
    >
      <View style={pdfStyles.colName}>
        <Text style={pdfStyles.headerText}>Test name</Text>
      </View>
      <View style={pdfStyles.colResult}>
        <Text style={pdfStyles.headerText}>Result</Text>
      </View>
      <View style={pdfStyles.colRef}>
        <Text style={pdfStyles.headerRefText}>Biological reference range</Text>
      </View>
    </View>
  );
}

function ResultUnitCell({ result, unit }: { result: string; unit: string }) {
  const display = result || '—';
  return (
    <View style={pdfStyles.colResult}>
      <View style={pdfStyles.colResultValues}>
        <Text style={pdfStyles.resultValue}>{display}</Text>
        {unit ? <Text style={pdfStyles.unitText}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function RefCell({ reference }: { reference: string }) {
  const lines = reference ? reference.split('\n') : ['—'];
  return (
    <View style={pdfStyles.colRef}>
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
  return <Text style={pdfStyles.methodText}>Method: {trimmed}</Text>;
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
        pdfStyles.tableRow,
        pdfStyles.tableRowMain,
        showDivider && includeReportDividers ? pdfStyles.tableRowDivider : undefined,
        { paddingBottom: 4 },
      ]}
    >
      <Text
        style={[
          pdfStyles.colName,
          row.isSubtest ? pdfStyles.subtestName : pdfStyles.testName,
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
    <View style={pdfStyles.testBlock}>
      {test.isPanel ? (
        <>
          <View style={pdfStyles.testHeading}>
            <Text style={pdfStyles.panelTitle}>{test.title}</Text>
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
            style={!isLastTest && includeReportDividers ? pdfStyles.testEntry : undefined}
          >
            <View
              style={[
                pdfStyles.tableRowMain,
                includeMethodLines ? pdfStyles.tableRowMainWithMethod : undefined,
              ]}
            >
              <Text style={[pdfStyles.colName, pdfStyles.testName]}>{row.name}</Text>
              <ResultUnitCell result={row.result} unit={row.unit} />
              <RefCell reference={row.reference} />
            </View>
            {includeMethodLines ? (
              <View style={pdfStyles.methodRow}>
                <View style={pdfStyles.colName}>
                  <MethodLine methodName={test.methodName} />
                </View>
                <View style={pdfStyles.colResult} />
                <View style={pdfStyles.colRef} />
              </View>
            ) : null}
          </View>
        ))
      )}
      {includeInterpretation && test.interpretation ? (
        <Text style={pdfStyles.interpretation}>Note: {test.interpretation}</Text>
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
  const typography = resolveLabResultPdfTypography(
    'standard',
    renderOptions.typographySize,
    renderOptions.fontSizesPt,
  );
  pdfStyles = createLabResultStandardPdfStyles(renderOptions.fontPreset, typography);
  const orderedTests = testsInReportOrder(snapshot.sections);
  const showSignOff =
    renderOptions.includeFooterDisclaimer ||
    renderOptions.includeAuthorizedSignature ||
    renderOptions.includePathologistDesignation;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <LetterheadBand
          imageSrc={letterheadImageSrc}
          useBuiltInSample={useBuiltInSampleLetterhead}
          showImage={renderOptions.includeLetterhead}
          bandHeightPt={letterheadBandHeightPt}
        />
        <View
          style={[
            pdfStyles.header,
            !renderOptions.includeReportDividers ? pdfStyles.headerPlain : undefined,
          ]}
        >
          <VisitDetailsBlock snapshot={snapshot} renderOptions={renderOptions} />
        </View>

        <View style={pdfStyles.resultsBlock}>
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
                    pdfStyles.section,
                    sectionIndex === 0
                      ? renderOptions.includeSpaceBeforeDepartment
                        ? pdfStyles.sectionFirstSpaced
                        : pdfStyles.sectionFirst
                      : undefined,
                  ]}
                >
                  {renderOptions.includeDepartmentHeadings ? (
                    <Text
                      style={[
                        pdfStyles.sectionTitle,
                        !renderOptions.departmentHeadingShaded ? pdfStyles.sectionTitlePlain : undefined,
                        renderOptions.tightDepartmentTopSpacing ? pdfStyles.sectionTitleTightTop : undefined,
                        renderOptions.spaciousDepartmentHeading
                          ? pdfStyles.sectionTitleSpacious
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
              pdfStyles.signOff,
              !renderOptions.includeReportDividers ? pdfStyles.signOffPlain : undefined,
            ]}
          >
            {renderOptions.includeFooterDisclaimer ? (
              <Text style={pdfStyles.footerNote}>
                Biological reference ranges are for clinical correlation only. This report was
                generated electronically.
              </Text>
            ) : null}
            {renderOptions.includeAuthorizedSignature ? (
              <Text style={pdfStyles.signOffLine}>
                Authorized signatory: _______________________________
              </Text>
            ) : null}
            {renderOptions.includePathologistDesignation ? (
              <Text style={pdfStyles.signOffLine}>Designation: Pathologist / Lab director</Text>
            ) : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
