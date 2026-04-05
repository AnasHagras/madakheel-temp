import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, FormSelect, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});

const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import { Close } from "@mui/icons-material";

import { getUserCookies } from "../../../../utils/getUserCookies";

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sended, setSended] = useState(false);
  const [sendReq, setSendReq] = useState(false);
  const [search, setSearch] = useState("");
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  const { token, id: adminId, user_type } = user;
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  function reset() {
    setSendReq(false);
    setCheckedList([]);
    setSended(false);
    setSelectedEmployee(null);
  }



  useEffect(() => {
    fetch(`http://192.34.59.161/api/v1/carts/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setData(data));
  }, [search, update]);
  const getStatusClass = (status) => {
    switch (status) {
      case "NEW":
        return "btn-primary_";
      case "PAID":
        return "btn-success_";
      case "REJECTED":
        return " btn-danger_";
      case "SOLD":
        return " btn-info_";
      case "PAYMENT_INITIATED":
        return " btn-dark_";
      case "PENDING":
        return " btn-warning_";
      case "UPLOADED_FILE":
        return " btn-secondary_";
        case "PAYMENT_INITIATED":
          return " btn-dark_";
      case "PAID_PARTIALLY":
        return " btn-secondary_";
      case "SOLD_PARTIALLY":
        return " btn-info_"; // Example, change as needed
      case "CANCELLED":
        return " btn-dark_";
      default:
        return " btn-light_"; // Default color
    }
  };
  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (
        <span>
          {user_type === "ADM" && sendReq && (
            <input
              type='checkbox'
              onChange={(e) => {
                if (e.target.checked) {
                  setCheckedList([...checkedList, row?.id]);
                } else {
                  setCheckedList(checkedList?.filter((c) => c !== row?.id));
                }
              }}
              checked={sended ? false : null}
            />
          )}
          <Link className='font-weight-bold d-flex align-items-center gap-2'
            href={`/dashboard/pages/purchases/${row?.id}/`}
          >
            <span>{row?.id}</span>
          </Link>
        </span>
      ),
    },
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={`/dashboard/pages/carts/${row?.id}/`}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
          >
            <i className={`ti ti-eye btn`} style={{ color: "purple", fontSize: 20, position: "relative", right: -8 }}></i>
          </OverlayTrigger>
        </Link>
      ),
    },
    {
      name: "الاسم",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={``}
        >
          {row?.user?.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row?.user?.mobile],
      sortable: true,
      cell: (row) => (
        <div className=''>{row?.user?.phone_number}</div>
      ),
    },

    {
      name: "الخصم",
      selector: (row) => [row?.total_price],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>{row?.discount_amount?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      ),
    },
    {
      name: "السعر النهائي",
      selector: (row) => [row?.total_price],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>{row?.final_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      ),
    },
    {
      name: "عدد المنتجات",
      selector: (row) => [row?.items],
      sortable: true,
      cell: (row) => <div>{row?.items.length}</div>,
    },

    {
      name: "تاريخ الشراء",
      selector: (row) => [row?.created_at],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
          {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      ),

      sortable: true,
    },
  ];

  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='السلة' />

      <PageHeader
        title='السلة'
        item='شركة وحيد'
        active_item='السلة'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10'>
                <div
                  className='d-flex justify-content-between'
                  style={{ marginBottom: "-5px" }}
                >
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      السلة
                    </label>
                    <input
                      type='text'
                      className='search-input'
                      placeholder='بحث'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
               
                  <Button onClick={exportToExcel}>Export to Excel</Button>
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationPerPage={200}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
