import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { chooseBillPageSize } from './billPageSize';
import {
  formatBillPdfDateTime,
  formatBillPdfMoney,
  formatPaymentMethod,
} from './billPdfFormat';
import type { BillPdfPageSize, BillPdfSnapshot } from './billPdfTypes';

function createStyles(pageSize: BillPdfPageSize) {
  const compact = pageSize === 'A5';
  return StyleSheet.create({
    page: {
      paddingTop: compact ? 28 : 36,
      paddingBottom: compact ? 28 : 36,
      paddingHorizontal: compact ? 24 : 40,
      fontSize: compact ? 9 : 10,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
    },
    header: {
      marginBottom: compact ? 10 : 14,
      borderBottomWidth: 1,
      borderBottomColor: '#d9d9d9',
      paddingBottom: compact ? 8 : 10,
    },
    hospital: {
      fontSize: compact ? 13 : 16,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
    },
    title: {
      fontSize: compact ? 10 : 11,
      color: '#595959',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
      gap: 8,
    },
    metaCol: { flex: 1 },
    label: { color: '#8c8c8c', fontSize: compact ? 8 : 9, marginBottom: 2 },
    value: { fontFamily: 'Helvetica-Bold' },
    section: { marginTop: compact ? 10 : 12 },
    sectionTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: compact ? 9 : 10,
      marginBottom: 6,
      color: '#434343',
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#bfbfbf',
      paddingBottom: 4,
      marginBottom: 4,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: '#f0f0f0',
    },
    colTest: { flex: 1, paddingRight: 6 },
    colQty: { width: compact ? 32 : 40, textAlign: 'right' },
    colRate: { width: compact ? 52 : 64, textAlign: 'right' },
    colAmt: { width: compact ? 56 : 68, textAlign: 'right' },
    headerText: { fontFamily: 'Helvetica-Bold', fontSize: compact ? 8 : 9 },
    totals: {
      marginTop: compact ? 8 : 10,
      alignSelf: 'flex-end',
      width: compact ? 200 : 240,
    },
    totalLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    totalGrand: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#8c8c8c',
      fontFamily: 'Helvetica-Bold',
      fontSize: compact ? 10 : 11,
    },
    balanceDue: {
      color: '#d48806',
      fontFamily: 'Helvetica-Bold',
    },
    footer: {
      marginTop: compact ? 10 : 14,
      fontSize: compact ? 8 : 9,
      color: '#8c8c8c',
    },
  });
}

type BillPdfDocumentProps = {
  snapshot: BillPdfSnapshot;
  renderOptions?: { includeLetterhead: boolean };
};

export function BillPdfDocument({ snapshot, renderOptions }: BillPdfDocumentProps) {
  const includeLetterhead = renderOptions?.includeLetterhead ?? true;
  const pageSize = chooseBillPageSize(snapshot);
  const styles = createStyles(pageSize);

  return (
    <Document title={`Bill ${snapshot.bill_number}`}>
      <Page size={pageSize} style={styles.page}>
        {includeLetterhead ? (
          <>
            <View style={styles.header}>
              <Text style={styles.hospital}>{snapshot.hospital_name}</Text>
              <Text style={styles.title}>Laboratory bill / receipt</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.label}>Bill no.</Text>
                  <Text style={styles.value}>{snapshot.bill_number}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.label}>Sample collected</Text>
                  <Text>{formatBillPdfDateTime(snapshot.sample_collected_at)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient</Text>
              <Text style={styles.value}>{snapshot.patient.name}</Text>
              <Text>
                UHID {snapshot.patient.uhid} · {snapshot.patient.ageSex} · {snapshot.patient.phone}
              </Text>
              {snapshot.patient.address !== '—' ? (
                <Text style={{ marginTop: 2 }}>{snapshot.patient.address}</Text>
              ) : null}
            </View>

            {snapshot.doctor_name !== '—' ? (
              <View style={styles.section}>
                <Text style={styles.label}>Referring doctor</Text>
                <Text>{snapshot.doctor_name}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests and charges</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.colTest, styles.headerText]}>Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
            <Text style={[styles.colAmt, styles.headerText]}>Amount</Text>
          </View>
          {snapshot.lines.map((line, index) => (
            <View key={`${line.description}-${index}`} style={styles.tableRow}>
              <Text style={styles.colTest}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colRate}>{formatBillPdfMoney(line.unit_price)}</Text>
              <Text style={styles.colAmt}>{formatBillPdfMoney(line.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>Subtotal</Text>
            <Text>{formatBillPdfMoney(snapshot.subtotal)}</Text>
          </View>
          {snapshot.discount_applied > 0 ? (
            <View style={styles.totalLine}>
              <Text>Discount</Text>
              <Text>-{formatBillPdfMoney(snapshot.discount_applied)}</Text>
            </View>
          ) : null}
          <View style={styles.totalGrand}>
            <Text>Total</Text>
            <Text>{formatBillPdfMoney(snapshot.total)}</Text>
          </View>
          {snapshot.advance_paid > 0 ? (
            <View style={styles.totalLine}>
              <Text>Advance paid</Text>
              <Text>{formatBillPdfMoney(snapshot.advance_paid)}</Text>
            </View>
          ) : null}
          {snapshot.balance_due > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.balanceDue}>Balance due</Text>
              <Text style={styles.balanceDue}>{formatBillPdfMoney(snapshot.balance_due)}</Text>
            </View>
          ) : null}
          <View style={styles.totalLine}>
            <Text>Payment</Text>
            <Text>{formatPaymentMethod(snapshot.payment_method)}</Text>
          </View>
          {snapshot.payment_transaction_id.trim() ? (
            <View style={styles.totalLine}>
              <Text>Txn ID</Text>
              <Text>{snapshot.payment_transaction_id.trim()}</Text>
            </View>
          ) : null}
        </View>

        {snapshot.notes.trim() ? (
          <View style={styles.footer}>
            <Text style={styles.label}>Notes</Text>
            <Text>{snapshot.notes.trim()}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
