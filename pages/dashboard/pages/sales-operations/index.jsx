import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, FormSelect, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
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
import { Close, Check, Cancel } from "@mui/icons-material";

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
const user = getUserCookies();

const SalesOperations = () => {
  const [data, setData] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSalesOperations, setLoadingSalesOperations] = useState(false);
  const [search, setSearch] = useState("");
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [selectionOrder, setSelectionOrder] = useState([]); // Track selection order
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type, accountant_level } = user;
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "sales-operations.xlsx");
  };


  const getSalesOperations = () => {
    setLoadingSalesOperations(true);
    
    let url;
    
    // Determine API endpoint based on accountant level
    if (accountant_level === 1) {
      url = `${baseUrl}/api/v1/group_selling/first_approval/?page=${page}&page_size=${perPage}`;
    } else if (accountant_level === 2) {
      url = `${baseUrl}/api/v1/group_selling/second_approval/?page=${page}&page_size=${perPage}`;
    } else {
      // Default fallback - you might want to handle this case differently
      url = `${baseUrl}/api/v1/group_selling/first_approval/?page=${page}&page_size=${perPage}`;
    }

    fetch(url, {
      headers: { "Authorization": token, "Content-Type": "application/json" }
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        if (res.status === 403) {
          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        data.results && setData(data.results)
        data.count && setTotalRows(data.count);
        setLoadingSalesOperations(false)
      })
      .catch((error) => {
        console.error("Error fetching sales operations:", error);
        setLoadingSalesOperations(false);
      });
  };

  const handleApproval = async (purchaseId, action) => {
    setLoading(true);
    try {
      let url;
      
      // Determine API endpoint based on accountant level
      if (accountant_level === 1) {
        url = `${baseUrl}/api/v1/group_selling/first_approval/`;
      } else if (accountant_level === 2) {
        url = `${baseUrl}/api/v1/group_selling/second_approval/`;
      } else {
        url = `${baseUrl}/api/v1/group_selling/first_approval/`;
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action,
          preview_sale_ids: [purchaseId]
        }),
      });
      
      if (res.status === 401) {
        logout();
        return;
      }
      
      const result = await res.json();
      console.log(result);
      
      if (result.success) {
        toast.success(result.message || `تم ${action === 'approve' ? 'الموافقة على' : 'رفض'} الطلب بنجاح`);
        forceUpdate();
      } else {
        toast.error(result.error || `حدث خطأ أثناء ${action === 'approve' ? 'الموافقة' : 'الرفض'}`);
      }
    } catch (error) {
      console.error("Error in approval:", error);
      toast.error(`حدث خطأ أثناء ${action === 'approve' ? 'الموافقة' : 'الرفض'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle sequential selection
  const handleSequentialSelection = (rowId, isChecked) => {
    if (isChecked) {
      // Check if this is the next item in sequence
      const currentOrder = [...selectionOrder];
      const nextIndex = currentOrder.length;
      
      // Find the index of this row in the data array
      const rowIndex = data.findIndex(row => row.preview_sale?.id === rowId);
      
      if (rowIndex === nextIndex) {
        // This is the correct next item to select
        setCheckedList([...checkedList, rowId]);
        setSelectionOrder([...currentOrder, rowId]);
      } else {
        // Show error message
        toast.error(`يجب تحديد الصف رقم ${nextIndex + 1} أولاً`);
        return false;
      }
    } else {
      // Unchecking - handle cascading deselection
      const deselectedIndex = selectionOrder.findIndex(id => id === rowId);
      
      if (deselectedIndex !== -1) {
        // Remove the deselected item and all items after it
        const newSelectionOrder = selectionOrder.slice(0, deselectedIndex);
        const newCheckedList = checkedList.filter(id => 
          newSelectionOrder.includes(id)
        );
        
        setCheckedList(newCheckedList);
        setSelectionOrder(newSelectionOrder);
        
        // Show info message about cascading deselection
        const removedCount = selectionOrder.length - deselectedIndex;
        if (removedCount > 1) {
          toast.info(`تم إلغاء تحديد ${removedCount} صفوف للحفاظ على الترتيب`);
        }
      }
    }
    return true;
  };

  // Helper function to get selection order number
  const getSelectionOrder = (rowId) => {
    const orderIndex = selectionOrder.findIndex(id => id === rowId);
    return orderIndex !== -1 ? orderIndex + 1 : null;
  };

  const handleBulkApproval = async (action) => {
    if (checkedList?.length > 0) {
      setLoading(true);
      try {
        let url;
        
        // Determine API endpoint based on accountant level
        if (accountant_level === 1) {
          url = `${baseUrl}/api/v1/group_selling/first_approval/`;
        } else if (accountant_level === 2) {
          url = `${baseUrl}/api/v1/group_selling/second_approval/`;
        } else {
          url = `${baseUrl}/api/v1/group_selling/first_approval/`;
        }
        
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: action,
            preview_sale_ids: checkedList
          }),
        });
        
        if (res.status === 401) {
          logout();
          return;
        }
        
        const result = await res.json();
        console.log(result);
        
        if (result.success) {
          toast.success(result.message || `تم ${action === 'approve' ? 'الموافقة على' : 'رفض'} ${checkedList?.length} طلب بنجاح`);
          setCheckedList([]);
          setSelectionOrder([]);
          forceUpdate();
        } else {
          toast.error(result.error || `حدث خطأ أثناء ${action === 'approve' ? 'الموافقة' : 'الرفض'}`);
        }
      } catch (error) {
        console.error("Error in bulk approval:", error);
        toast.error(`حدث خطأ أثناء ${action === 'approve' ? 'الموافقة' : 'الرفض'}`);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("الرجاء تحديد طلب واحد على الأقل");
    }
  };

  useEffect(() => {
    getSalesOperations();
  }, [update, page, accountant_level]);

  useEffect(() => {
    if (search.length < 3) {
      if (search.length == 0) {
        setSearch('')
      }
      else return;
    }
    setPage(1)
    getSalesOperations();
  }, [search]);

  useEffect(() => {
    getSalesOperations()
  }, [page]);

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
      case "PAID_PARTIALLY":
        return " btn-secondary_";
      case "ready_for_sale":
        return " btn-secondary_";
      case "SOLD_PARTIALLY":
        return " btn-info_";
      case "CANCELLED":
        return " btn-dark_";
      case "group_selling":
        return " btn-warning_";
      case "first_approval":
        return " btn-info_";
      case "second_approval":
        return " btn-primary_";
      default:
        return " btn-light_";
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => {
        const selectionNumber = getSelectionOrder(row?.preview_sale?.id);
        return (
          <span className="d-flex w-100">
            <span className="w-25">
              <input
                type="checkbox"
                className="w-100"
                onChange={(e) => {
                  handleSequentialSelection(row?.preview_sale?.id, e.target.checked);
                }}
                checked={checkedList.includes(row?.preview_sale?.id)}
              />
            </span>
            <Link className='font-weight-bold d-flex align-items-center gap-2 ms-2'
              href={`/dashboard/pages/purchases/${row?.id}/`}
            >
              <span style={{ width: '50px' }}>{row?.id}</span>
              {selectionNumber && (
                <span 
                  className="badge bg-primary ms-1" 
                  style={{ fontSize: '10px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {selectionNumber}
                </span>
              )}
            </Link>
          </span>
        );
      },
      width: '200px'
    },
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={`/dashboard/pages/purchases/${row?.id}/`}
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
          href={`/dashboard/pages/users/${row?.user_id}/`}
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
        <div className=''>
          {row?.user?.mobile} {' '}
          <span dir="ltr">{row?.user?.country_code?.code}</span>
        </div>
      ),
      width: '150px'
    },
    {
      name: "الباقة",
      selector: (row) => [row?.package?.title],
      cell: (row) =>
        row?.package && (
          <Link
            className='font-weight-bold'
            href={`/dashboard/pages/packages/${row?.package?.id}/`}
          >
            {row?.package?.title}
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
      name: "موظفوا المبيعات",
      selector: (row) => row?.sale_employees,
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col text-center w-100">
          {row?.user?.sale_employees?.length > 0 ? (
            row.user.sale_employees.map((employee) => (
              <div key={employee.id} className="flex items-center">
                <span>{employee.admin.name}</span>
              </div>
            ))
          ) : (
            <span className="text-gray-500 w-100 flex items-center"> -  </span>
          )}
        </div>
      ),
      width: '150px'
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
              {row?.status === "group_selling"
                ? "طلبات متأخرة"
                : row?.status === "first_approval"
                  ? "في انتظار الموافقة الأولى"
                  : row?.status === "second_approval"
                    ? "في انتظار الموافقة الثانية"
                    : row?.status === "NEW"
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
                                    : row?.status === "ready_for_sale"
                                      ? " جاهزة للبيع"
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
          <span className='my-auto'>{new Date(row?.datetime).toLocaleDateString()}</span>
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
      <Seo title='عمليات البيع' />

      <PageHeader
        title='عمليات البيع'
        item='شركة وحيد'
        active_item='عمليات البيع'
      />

      <div>
        <Row className='row-sm' style={{ minHeight: '100vh' }}>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10 '>
                <div
                  className='d-flex justify-content-between flex-wrap'
                  style={{ marginBottom: "-5px" }}
                >
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      عمليات البيع
                      <span className="ms-2 text-muted">
                        {/* (المستوى {accountant_level === 1 ? 'الأول' : accountant_level === 2 ? 'الثاني' : 'غير محدد'}) */}
                      </span>
                      <button disabled={loadingSalesOperations} onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>
                      </button>
                    </label>
                  </div>
                  <div className="dd-flex flex-wrap gap-2">
                    <div>
                      <div className='d-flex gap-3 align-items-center'>
                        <h5 className='font-weight-bold'>
                          {checkedList?.length < 1
                            ? "يجب تحديد الطلبات"
                            : ` عدد الطلبات (${checkedList?.length})`}
                        </h5>
                        <Button
                          disabled={
                            loading ||
                            checkedList?.length < 1
                              ? true
                              : false
                          }
                          onClick={() => handleBulkApproval('approve')}
                          variant="success"
                          className="d-flex align-items-center gap-1"
                        >
                          <Check fontSize="small" />
                          {loading ? "جاري الموافقة..." : "موافقة "}
                        </Button>
                        {/* <Button
                          disabled={
                            loading ||
                            checkedList?.length < 1
                              ? true
                              : false
                          }
                          onClick={() => handleBulkApproval('reject')}
                          variant="danger"
                          className="d-flex align-items-center gap-1"
                        >
                          <Cancel fontSize="small" />
                          {loading ? "جاري الرفض..." : "رفض جماعي"}
                        </Button> */}
                        {checkedList?.length > 0 && (
                          <button
                            onClick={() => {
                              setCheckedList([]);
                              setSelectionOrder([]);
                            }}
                            variant='danger'
                            style={{
                              background: "red",
                              width: 30,
                              height: 30,
                            }}
                            className='d-flex justify-content-center align-items-center rounded-circle p-0 text-white border-0'
                          >
                            <Close fontSize='small' />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* <Button className="mt-2 mt-md-0 ms-md-2" onClick={exportToExcel}>Export to Excel</Button> */}
                  </div>
                </div>
                
              </Card.Header>
              <Card.Body className="pos-relative">
                {/* <input
                  type='text'
                  className='search-input'
                  style={{ top: '30px' }}
                  placeholder='بحث'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                /> */}
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={(page) => {
                      console.log(page);
                      setPage(page)
                    }}
                    paginationPerPage={perPage}
                    onChangeRowsPerPage={(newPerPage, page) => {
                      setPerPage(newPerPage);
                      setPage(page);
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

SalesOperations.layout = "Contentlayout";

export default SalesOperations;
