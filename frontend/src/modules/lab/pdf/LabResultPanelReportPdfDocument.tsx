import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  departmentTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  panelTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  singleTestTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
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
  colValue: { width: '18%', fontFamily: 'Helvetica-Bold' },
  colUnit: { width: '14%' },
  colRef: { width: '26%', textAlign: 'right', fontSize: 8 },
  headerCell: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  narrativeBlock: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 8.5,
    lineHeight: 1.35,
    color: '#333',
  },
  narrativeHeading: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  sectionGap: { marginBottom: 16 },
  endReport: {
    marginTop: 14,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  patientHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    paddingBottom: 12,
    marginBottom: 14,
  },
  patientName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
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
    fontFamily: 'Helvetica-Bold',
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
  signOffLine: { marginTop: 8, fontSize: 9 },
  footerNote: { marginTop: 8, fontSize: 8, color: '#8c8c8c' },
});

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
    <View style={styles.tableHeader}>
      <Text style={[styles.colTest, styles.headerCell]}>TEST</Text>
      <Text style={[styles.colValue, styles.headerCell]}>VALUE</Text>
      <Text style={[styles.colUnit, styles.headerCell]}>UNIT</Text>
      <Text style={[styles.colRef, styles.headerCell]}>REFERENCE</Text>
    </View>
  );
}

function ResultTableRow({ row }: { row: LabResultPdfRow }) {
  const ref = row.reference?.trim() || '—';
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.colTest, row.isSubtest ? { paddingLeft: 8 } : undefined]}>{row.name}</Text>
      <Text style={styles.colValue}>{row.result?.trim() || '—'}</Text>
      <Text style={styles.colUnit}>{row.unit?.trim() || '—'}</Text>
      <Text style={styles.colRef}>{ref}</Text>
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
          <View key={index} style={styles.narrativeBlock}>
            {titled ? (
              <>
                <Text style={styles.narrativeHeading}>{firstLine}</Text>
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
    <View style={styles.sectionGap}>
      <Text style={test.isPanel ? styles.panelTitle : styles.singleTestTitle}>{title}</Text>
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
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>: {value}</Text>
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
    <View style={styles.patientHeader}>
      <Text style={styles.patientName}>{snapshot.patient.name}</Text>
      <View style={styles.patientHeaderRow}>
        <View style={styles.patientColLeft}>
          <PatientDetailRow
            label="Age / Sex"
            value={formatPanelAgeSex(snapshot.patient.age_years, snapshot.patient.gender)}
          />
          <PatientDetailRow label="Referred by" value={doctor} />
          {showHospital ? (
            <PatientDetailRow label="Hospital" value={snapshot.hospital_name.trim()} />
          ) : null}
        </View>
        <View style={styles.patientColRight}>
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
  const showSignOff =
    renderOptions.includeFooterDisclaimer ||
    renderOptions.includeAuthorizedSignature ||
    renderOptions.includePathologistDesignation;

  const sections = snapshot.sections.filter((section) => section.tests.length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PatientDetailsBlock snapshot={snapshot} renderOptions={renderOptions} />

        {sections.map((section: LabResultPdfSection) => (
          <View key={section.departmentName}>
            {renderOptions.includeDepartmentHeadings ? (
              <Text style={styles.departmentTitle}>{section.departmentName}</Text>
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

        <Text style={styles.endReport}>~~~ End of report ~~~</Text>

        {showSignOff ? (
          <View style={styles.signOff}>
            {renderOptions.includeFooterDisclaimer ? (
              <Text style={styles.footerNote}>
                Biological reference ranges are for clinical correlation only. This report was
                generated electronically.
              </Text>
            ) : null}
            <View style={styles.signOffRow}>
              <View style={styles.signOffCol}>
                {renderOptions.includeAuthorizedSignature ? (
                  <Text style={styles.signOffLine}>Lab Incharge</Text>
                ) : null}
              </View>
              <View style={styles.signOffCol}>
                {renderOptions.includePathologistDesignation ? (
                  <Text style={styles.signOffLine}>Pathologist</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
