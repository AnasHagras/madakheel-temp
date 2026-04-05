import React, { useEffect, useState, useMemo, memo } from "react";
import PageHeader from "../../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Row } from "react-bootstrap";
import dynamic from "next/dynamic";
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../../shared/layout-components/seo/seo";
import DataTable from "react-data-table-component";

const Orders = ({ user }) => {
  const [data, setData] = useState([]);
  const [showPrintElements, setShowPrintElements] = useState(false);

  const DataTableExtensions = dynamic(
    () => import("react-data-table-component-extensions"),
    { ssr: false }
  );

  const printData = async () => {
    setShowPrintElements(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const input = document.getElementById("printable-area");
    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .from(input)
      .save()
      .then(() => {
        setShowPrintElements(false);
      });
  };

  useEffect(() => {
    const selectedData = JSON.parse(window.localStorage.getItem("selectedWallets"));
    setData(selectedData);
  }, []);

  const columns = useMemo(
    () => [
      {
        name: "اسم العميل",
        selector: (row) => [row.customer?.name],
        sortable: true,
        cell: (row) => (
          <div
            className="font-weight-bold"
            href={`/dashboard/pages/users/${row.customer?.id}/`}
          >
            {row.customer?.name}
          </div>
        ),
      },
      {
        name: "رقم الأيبان",
        selector: (row) => [row.customer?.mobile],
        cell: (row) => (
          <div className="font-weight-bold">{row.customer?.iban}</div>
        ),
        sortable: true,
      },
      {
        name: " اسم البنك",
        selector: (row) => [row.customer?.mobile],
        cell: (row) => (
          <div className="font-weight-bold">{row.customer?.bank_name}</div>
        ),
        sortable: true,
      },
      {
        name: "المبلغ",
        selector: (row) => [row.amount.toFixed(3)],
        sortable: true,
        cell: (row) => (
          <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
            {(+row.amount)
              .toFixed(2)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </div>
        ),
      },
    ],
    []
  );

  const tableData = useMemo(
    () => ({
      columns,
      data,
    }),
    [columns, data]
  );

  const MemoizedDataTable = memo(({ columns, data }) => (
    <DataTable
      columns={columns}
      data={data}
      defaultSortAsc={false}
      pagination
      paginationPerPage={200}
      paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
    />
  ));

  // Set displayName for the memoized component
  MemoizedDataTable.displayName = "MemoizedDataTable";

  return (
    <>
      <Seo title="تقارير المحافظ" />
      <PageHeader
        title="تقارير المحافظ"
        item="شركة وحيد"
        active_item={"تقارير "}
      />
      <div>
        <Row className="row-sm">
          <Col md={12} lg={12}>
            <Card className="custom-card">
              <Card.Header className="border-bottom-0">
                <div style={{ marginBottom: "15px" }}>
                  <div className="d-flex">
                    <label className="main-content-label my-auto">
                      طباعة تقرير المحافظ
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body id="printable-area">
                {!showPrintElements && (
                  <div className="d-flex justify-content-end">
                    <Button onClick={printData}>طباعة التقرير</Button>
                  </div>
                )}
                {showPrintElements && (
                  <div className="d-flex justify-content-center">
                    <Button>تقارير المحافظ</Button>
                  </div>
                )}
                <DataTableExtensions {...tableData}>
                  <MemoizedDataTable columns={columns} data={data} />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;