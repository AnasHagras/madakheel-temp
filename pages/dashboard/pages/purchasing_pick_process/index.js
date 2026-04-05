import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
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
import * as XLSX from 'xlsx';
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id, user_type } = user;
  const [isCanUpdateAndConfirmRecite, setIsCanUpdateAndConfirmRecite] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);  
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
  
  useEffect(() => {
    if ( user_type === "ACC") {
    const permissions =  JSON.parse(localStorage.getItem("permissions"))
    const componentPermissions = permissions?.filter(
      (permission) => permission.group_name === 'مبيعات الاستلام'
    );
    const canUpdateAndConfirmRecite = componentPermissions?.some((permission) => permission.display_name === 'تأكيد وتعديل مبلغ الإيصال');
    const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
    setIsCanUpdateAndConfirmRecite(canUpdateAndConfirmRecite);
    setIsCanUpdate(canUpdate);
  }
  }, [user]);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };

  // Initialize URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (didInitFromUrlRef.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    
    let paramsChanged = false;
    
    if (qPage && !Number.isNaN(Number(qPage)) && Number(qPage) !== page) {
      setPage(Number(qPage));
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize)) && Number(qPageSize) !== perPage) {
      setPerPage(Number(qPageSize));
      paramsChanged = true;
    }
    
    didInitFromUrlRef.current = true;
    if (paramsChanged) {
      setTimeout(() => {
        urlInitRef.current = true;
        forceUpdate();
      }, 0);
    } else {
      urlInitRef.current = true;
      forceUpdate();
    }
  }, []);

  // Follow-up effect to enable fetches after URL params are applied
  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      forceUpdate();
    }
  }, [page, perPage]);

  // Data fetching effect
  useEffect(() => {
    if (!urlInitRef.current) return;
    
    const abortController = new AbortController();
    const seq = (requestSeqRef.current += 1);
    const currentSeq = seq;
    
    setLoading(true);
    fetch(
      `${baseUrl}/api/v1/admin/purchasing_pick_process/?admin_id=${id}&page=${page}&page_size=${perPage}`,
      {
        headers: {
          Authorization: `${token}`,
        },
        signal: abortController.signal,
      },
    )
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        if (currentSeq !== requestSeqRef.current) return; // Ignore stale response
        
        data.results && setData(data.results)
        data.count && setTotalRows(data.count);
        setLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (currentSeq === requestSeqRef.current) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [id, token, update, page, perPage]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    
    const nextQuery = {};
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, perPage]);

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "الاسم",
      selector: (row) => [row.user?.name],
      cell: (row) => <div className='font-weight-bold'>{row.user?.name}</div>,
      sortable: true,
    },
    {
      name: "الباقة",
      selector: (row) => [row.package?.title],
      cell: (row) => (
        <div className='font-weight-bold'>{row.package?.title}</div>
      ),
      sortable: true,
    },
    {
      name: "الكمية",
      selector: (row) => [row.quantity],
      sortable: true,
      cell: (row) => <div>{row.quantity}</div>,
    },
    {
      name: "السعر الكلي",
      selector: (row) => [row.total_price],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>{row.total_price.toFixed(2)}</div>
      ),
    },
    {
      name: "الربح",
      selector: (row) => [row.profit],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.profit?.toFixed(2)}</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "الحالة",
      selector: (row) => [row.status],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
            {row.status === "NEW"
              ? "جديد غير مدفوع"
              : row.status === "PAID"
                ? "مدفوعة"
                : row?.status === "UPLOADED_FILE"
                  ? "تم رفع الإيصال"
                  : row?.status === "SOLD_PARTIALLY"
                    ? "قائمة"
                    : row?.status === "PAID_PARTIALLY"
                      ? "مدفوع جزئيا"
                    : row?.status === "PAYMENT_INITIATED"
                      ? " تمت محاولة الدفع"
                      : row.status}
          </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "التاريخ ",
      selector: (row) => [row.datetime],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
            {new Date(row.datetime).toLocaleDateString("en-GB")}
          </span>
        </div>
      ),

      sortable: true,
    },

    {
      name: "عرض",
      selector: (row) => [row.is_active],
      sortable: true,
      cell: (row) => (
        <Link
          className='button-list'
          href={`/dashboard/pages/purchasing_pick_process/${row.id}/`}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
          >
            <i className={`ti ti-eye btn`}></i>
          </OverlayTrigger>
        </Link>
      ),
    },
  ];

  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='مبيعات الاستلام' />

      <PageHeader
        title='مبيعات الاستلام'
        item='شركة وحيد'
        active_item='مبيعات الاستلام'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10'>
                <div style={{ marginBottom: "-5px" }}>
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      مبيعات الاستلام
                      <button onClick={()=> forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                                               <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationServer  
                    paginationTotalRows={totalRows}
                    paginationDefaultPage={page}
                    onChangePage={(newPage) => { if (Number(newPage) !== Number(page)) setPage(Number(newPage)); }}
                    paginationPerPage={perPage}  
                    onChangeRowsPerPage={(newPerPage, nextPage) => {
                      const willChangePerPage = Number(newPerPage) !== Number(perPage);
                      const willChangePage = Number(nextPage) !== Number(page);
                      if (willChangePerPage) setPerPage(Number(newPerPage));
                      if (willChangePage) setPage(Number(nextPage));
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={loading || !urlInitRef.current}
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
