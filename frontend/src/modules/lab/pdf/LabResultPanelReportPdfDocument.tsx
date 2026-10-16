import { Document, Page, Text, View } from '@react-pdf/renderer';

import { formatBillPdfDateTime } from '../../billing/pdf/billPdfFormat';
import type { LabResultPdfRenderOptions } from './labResultPdfRender';
import { DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS } from './labResultPdfRender';
import type {
  LabResultPdfRow,
  LabResultPdfSection,
  LabResultPdfSnapshot,
  LabResultPdfTest,
} from './labResultPdfTypes';
import { formatDoctorForReport, isHospitalNamePresent } from './labResultPdfVisitFormat';
import {
  createLabResultPanelReportPdfStyles,
  type LabResultPanelReportPdfStyles,
} from './labResultPanelReportPdfStyles';
import { resolveLabResultPdfTypography } from './labResultPdfTypography';

let pdfStyles: LabResultPanelReportPdfStyles;

function formatPanelAgeSex(ageYears: number | null, gender: 'M' | 'F' | 'O'): string {
  const agePart = ageYears != null ? `${ageYears} YRS` : '—';
  return `${agePart} / ${gender}`;
}

function formatPanelDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ColumnHeader() {
  return (
    <View style={pdfStyles.tableHeader}>
      <Text style={[pdfStyles.colTest, pdfStyles.headerCell]}>TEST</Text>
      <Text style={[pdfStyles.colValue, pdfStyles.headerCell]}>VALUE</Text>
      <Text style={[pdfStyles.colUnit, pdfStyles.headerCell]}>UNIT</Text>
      <Text style={[pdfStyles.colRef, pdfStyles.headerCell]}>REFERENCE</Text>
    </View>
  );
}

function ResultTableRow({ row }: { row: LabResultPdfRow }) {
  const ref = row.reference?.trim() || '—';
  return (
    <View style={pdfStyles.tableRow}>
      <Text style={[pdfStyles.colTest, row.isSubtest ? { paddingLeft: 8 } : undefined]}>{row.name}</Text>
      <Text style={pdfStyles.colValue}>{row.result?.trim() || '—'}</Text>
      <Text style={pdfStyles.colUnit}>{row.unit?.trim() || '—'}</Text>
      <Text style={pdfStyles.colRef}>{ref}</Text>
    </View>
  );
}

function NarrativeBlocks({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const blocks = trimmed.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        const firstLine = lines[0]?.trim() ?? '';
        const rest = lines.slice(1).join('\n').trim();
        const titled =
          rest.length > 0 && firstLine.length < 80 && !firstLine.includes('.') && lines.length > 1;
        return (
          <View key={index} style={pdfStyles.narrativeBlock}>
            {titled ? (
              <>
                <Text style={pdfStyles.narrativeHeading}>{firstLine}</Text>
                <Text>{rest}</Text>
              </>
            ) : (
              <Text>{block}</Text>
            )}
          </View>
        );
      })}
    </>
  );
}

function TestBlock({
  test,
  includeInterpretation,
}: {
  test: LabResultPdfTest;
  includeInterpretation: boolean;
}) {
  const title = test.isPanel ? test.title : test.rows[0]?.name ?? test.title;
  return (
    <View style={pdfStyles.sectionGap}>
      <Text style={test.isPanel ? pdfStyles.panelTitle : pdfStyles.singleTestTitle}>{title}</Text>
      <ColumnHeader />
      {test.rows.map((row, index) => (
        <ResultTableRow key={index} row={row} />
      ))}
      {includeInterpretation && test.interpretation ? (
        <NarrativeBlocks text={test.interpretation} />
      ) : null}
    </View>
  );
}

function PatientDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.detailRow}>
      <Text style={pdfStyles.detailLabel}>{label}</Text>
      <Text style={pdfStyles.detailValue}>: {value}</Text>
    </View>
  );
}

function PatientDetailsBlock({
  snapshot,
  renderOptions,
}: {
  snapshot: LabResultPdfSnapshot;
  renderOptions: LabResultPdfRenderOptions;
}) {
  const doctor = formatDoctorForReport(snapshot.doctor_name);
  const showHospital =
    renderOptions.includeHospitalName && isHospitalNamePresent(snapshot.hospital_name);

  return (
    <View style={pdfStyles.patientHeader}>
      <Text style={pdfStyles.patientName}>{snapshot.patient.name}</Text>
      <View style={pdfStyles.patientHeaderRow}>
        <View style={pdfStyles.patientColLeft}>
          <PatientDetailRow
            label="Age / Sex"
            value={formatPanelAgeSex(snapshot.patient.age_years, snapshot.patient.gender)}
          />
          <PatientDetailRow label="Referred by" value={doctor} />
          {showHospital ? (
            <PatientDetailRow label="Hospital" value={snapshot.hospital_name.trim()} />
          ) : null}
        </View>
        <View style={pdfStyles.patientColRight}>
          {renderOptions.includeSampleCollectionTime ? (
            <PatientDetailRow
              label="Collected on"
              value={formatPanelDate(snapshot.sample_collected_at)}
            />
          ) : null}
          <PatientDetailRow
            label="Reported on"
            value={formatBillPdfDateTime(snapshot.reported_at)}
          />
          <PatientDetailRow label="Bill no." value={snapshot.bill_number} />
        </View>
      </View>
    </View>
  );
}

export function LabResultPanelReportPdfDocument({
  snapshot,
  renderOptions = DEFAULT_LAB_RESULT_PDF_RENDER_OPTIONS,
}: {
  snapshot: LabResultPdfSnapshot;
  renderOptions?: LabResultPdfRenderOptions;
}) {
  const typography = resolveLabResultPdfTypography(
    'panel-report',
    renderOptions.typographySize,
    renderOptions.fontSizesPt,
  );
  pdfStyles = createLabResultPanelReportPdfStyles(renderOptions.fontPreset, typography);

  const showSignOff =
    renderOptions.includeFooterDisclaimer ||
    renderOptions.includeAuthorizedSignature ||
    renderOptions.includePathologistDesignation;

  const sections = snapshot.sections.filter((section) => section.tests.length > 0);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PatientDetailsBlock snapshot={snapshot} renderOptions={renderOptions} />

        {sections.map((section: LabResultPdfSection) => (
          <View key={section.departmentName}>
            {renderOptions.includeDepartmentHeadings ? (
              <Text style={pdfStyles.departmentTitle}>{section.departmentName}</Text>
            ) : null}
            {section.tests.map((test) => (
              <TestBlock
                key={`${test.testCode}-${test.title}`}
                test={test}
                includeInterpretation={renderOptions.includeInterpretation}
              />
            ))}
          </View>
        ))}

        <Text style={pdfStyles.endReport}>~~~ End of report ~~~</Text>

        {showSignOff ? (
          <View style={pdfStyles.signOff}>
            {renderOptions.includeFooterDisclaimer ? (
              <Text style={pdfStyles.footerNote}>
                Biological reference ranges are for clinical correlation only. This report was
                generated electronically.
              </Text>
            ) : null}
            <View style={pdfStyles.signOffRow}>
              <View style={pdfStyles.signOffCol}>
                {renderOptions.includeAuthorizedSignature ? (
                  <Text style={pdfStyles.signOffLine}>Lab Incharge</Text>
                ) : null}
              </View>
              <View style={pdfStyles.signOffCol}>
                {renderOptions.includePathologistDesignation ? (
                  <Text style={pdfStyles.signOffLine}>Pathologist</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
