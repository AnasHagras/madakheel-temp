import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  Nav,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
// images
import * as XLSX from 'xlsx';
import checkUserType from "../../../../utils/checkUserType";
import { useRouter } from "next/router";
import Select from 'react-select';

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import Link from "next/link";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([
    {
      id: "1",
      label: "Record Label 1",
      action: "create",
      changes: "Added new item",
      created_at: "2024-10-31T12:00:00Z",
      user_name: "John Doe",
      user_mobile: "+1234567890",
      reference_object_type: "Item",
      reference_object_id: "101"
    },
    {
      id: "2",
      label: "Record Label 2",
      action: "update",
      changes: "Updated item details",
      created_at: "2024-10-30T15:30:00Z",
      user_name: "Jane Smith",
      user_mobile: "+0987654321",
      reference_object_type: "Category",
      reference_object_id: "202"
    },
  ]);

  const [search, setSearch] = useState(false);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [filter, filterUpdate] = useReducer((x) => x + 1, 0);
  const router = useRouter();
  const { type } = router.query;
  const { token, id, user_type } = user;

  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [users, setUsers] = useState([]);


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };

  useEffect(() => {


    fetch(`${baseUrl}/api/v1/list_sale_employee/${id}/`, {
      headers: {
        Authorization: ` ${user.token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        return res.json();
      })
      .then((data) => {
        setData(data.received_purchases);
      });







  }, [update]);


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1)
  };


  const handleInputChange = (inputValue) => {
    setSearch(inputValue); // Call the onSearch function to update search term
  };
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
        <span className="d-flex w-100">
        
          <Link className='font-weight-bold d-flex align-items-center  gap-2 ms-2'
            href={``}
          >
            <span style={{ width: '50px' }}>{row?.id}</span>
          </Link>
        </span>
      ),
      // width: sendReq ? '200px' : '120px'
    },
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={``}
        >
          <span>{`عرض الشراء رقم ${row.id}`}</span>
        </Link>
      ),
      width: '150px'
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
        <div className=''>{row?.user?.mobile}</div>
      ),
    },

    {
      name: "الباقة",
      selector: (row) => [row?.Package?.title],
      cell: (row) =>
        row?.Package && (
          <Link
            className='font-weight-bold'
            href={``}
          >
            {row?.Package?.title}
          </Link>
        ),
      sortable: true,
    },

    {
      name: "السعر",
      selector: (row) => [row?.total_price],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>{row?.total_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      ),
    },
    {
      name: "الكمية",
      selector: (row) => [row?.quantity],
      sortable: true,
      cell: (row) => <div>{row?.quantity}</div>,
    },

    {
      name: "حالة الطلب",
      selector: (row) => [row?.status],
      cell: (row) => {
        const statusClass = getStatusClass(row?.status);
        return (
          <div className='d-flex my-auto' style={{ minWidth: "100px" }}>
            <span className={`${statusClass} my-auto`} style={{ fontSize: 12 }} >
              {row?.status === "NEW"
                ? "جديد غير مدفوع"
                : row?.status === "PAID"
                  ? "مدفوعة"
                  : row?.status === "REJECTED"
                    ? "مرفوضة"
                    : row?.status === "SOLD"
                      ? "مبيعة كاملة"
                      : row?.status === "PENDING"
                        ? "انتظار"
                        : row?.status === "UPLOADED_FILE"
                          ? "تم رفع الإيصال"
                          : row?.status === "SOLD_PARTIALLY"
                            ? "قائمة"
                            : row?.status === "CANCELLED"
                              ? "ملغية"
                              : row?.status === "PAID_PARTIALLY"
                                ? "مدفوع جزئيا"
                                : row?.status === "PAYMENT_INITIATED"
                                  ? " تمت محاولة الدفع"
                                  : row?.status}
            </span>
          </div>
        )
      },

      sortable: true,
    },
    {
      name: "تاريخ الشراء",
      selector: (row) => [row?.datetime],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row?.datetime}</span>
        </div>
      ),

      sortable: true,
    },
  ];


  const tableData = {
    columns,
    data,
  };

  const isAdmin = checkUserType();



  return (
    <>
      <Seo title=' السجلات' />

      <PageHeader title=' السجلات' item='شركة وحيد ' active_item=' السجلات' />

      <div>

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card ' >

              <Card.Header className=' border-bottom-0 pb-10'>
                <div style={{ marginBottom: "-5px" }}>


                  <div className='d-flex justify-content-start align-items-center flex-wrap rpw'>



                    <Button className="me-2" onClick={exportToExcel}>تصدير اكسيل  </Button>


                  </div>

                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ overflowX: 'auto ' }}>

                  <DataTableExtensions {...tableData}>
                    <DataTable
                      columns={columns}
                      data={data}
                      pagination
                      paginationServer
                      paginationTotalRows={totalRows}
                      onChangeRowsPerPage={handlePerRowsChange}
                      onChangePage={handlePageChange}
                      paginationPerPage={perPage}
                      paginationRowsPerPageOptions={[20]}
                      defaultSortAsc={false}
                      // responsive={false}
                      style={{ minWidth: '800px' }}
                    />
                  </DataTableExtensions>
                </div>
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

