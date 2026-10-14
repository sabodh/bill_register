import { Card, Typography } from 'antd';

import { PageHeader } from '../../components/PageHeader';

export function LabResultsPage() {
  return (
    <>
      <PageHeader
        title="Lab results"
        subtitle="Result entry uses each test’s result_entry_layout from the test master"
        breadcrumbs={[{ title: 'Lab' }, { title: 'Result' }]}
      />
      <Card>
        <Typography.Paragraph>
          Configure tests under <strong>Lab → Tests</strong>. Each test type defines a template:
        </Typography.Paragraph>
        <ul>
          <li>
            <strong>Normal</strong> — one result field + unit + reference range (e.g. Blood glucose 120
            mg/dL).
          </li>
          <li>
            <strong>Subtest</strong> — panel title + table of subtests; staff fill only the Result column
            (e.g. DC count).
          </li>
          <li>
            <strong>Has multiple reference range</strong> — one result on the same line as the test name;
            extra categories (Male, Female, Children, …) on indented lines for PDF.
          </li>
          <li>
            <strong>Special test</strong> — billing only (e.g. X-ray); no reference ranges or result
            entry.
          </li>
        </ul>
        <Typography.Paragraph type="secondary">
          The same <code>result_entry_layout</code> JSON from the API will drive this screen and PDF
          rendering once orders are linked to bills. Use the preview at the bottom of each test tab while
          designing.
        </Typography.Paragraph>
      </Card>
    </>
  );
}
