import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, OverlayTrigger, Row, Tooltip, Button, Form } from "react-bootstrap";
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
// images
import active from "../../../../public/assets/img/reverse.png";
import { toast } from "react-toastify";

const ReversePopup = ({
  setOperationPopup,
  operationData,
  adminId,
  forceUpdate,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const reverseOperation = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("customer_id", operationData?.customer?.id);
    fd.append("admin", adminId);
    const res = await fetch(
      `${baseUrl}/api/v1/reverse_transaction/${operationData?.id}/`,
      { method: "PATCH", body: fd, headers: { Authorization: `${token}` } },
    );
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      if (result?.success) {
        toast.success(result?.message);
        forceUpdate();
      } else {
        toast.error(result?.message);
      }
    } else toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة اخرى");
    setLoading(false);
    setOperationPopup(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من عكس العملية </h4>
          <img
            src={active.src}
            style={{}}
            alt='stop'
            width={80}
            className='my-4'
          />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={reverseOperation}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري العكس ..." : "عكس العملية"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setOperationPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [operationPopup, setOperationPopup] = useState(false);
  const [operationData, setOperationData] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
  useEffect(() => {
      if (user_type === "ACC") {
        const permissions =  JSON.parse(localStorage.getItem("permissions"))
        const componentPermissions = permissions?.filter(
              (permission) => permission.group_name === 'سجلات التحويل'
          );

          const canUpdate = componentPermissions?.some((permission) => permission.display_name === "عكس التحويل");


          setIsCanUpdate(canUpdate);
      }
  }, [user]);

  // Initialize URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (didInitFromUrlRef.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    const qStartDate = params.get('start_date');
    const qEndDate = params.get('end_date');
    
    let paramsChanged = false;
    
    if (qSearch && qSearch !== search) {
      setSearch(qSearch);
      setDebouncedSearch(qSearch);
      setCustomerName(qSearch);
      paramsChanged = true;
    }
    if (qPage && !Number.isNaN(Number(qPage)) && Number(qPage) !== page) {
      setPage(Number(qPage));
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize)) && Number(qPageSize) !== perPage) {
      setPerPage(Number(qPageSize));
      paramsChanged = true;
    }
    if (qStartDate && qStartDate !== startDate) {
      setStartDate(qStartDate);
      paramsChanged = true;
    }
    if (qEndDate && qEndDate !== endDate) {
      setEndDate(qEndDate);
      paramsChanged = true;
    }
    
    didInitFromUrlRef.current = true;
    if (paramsChanged) {
      // Wait for state to update before enabling fetches
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
  }, [page, perPage, customerName, startDate, endDate, debouncedSearch]);

  // Data fetching effect
  useEffect(() => {
    if (!urlInitRef.current) return;
    
    const abortController = new AbortController();
    const seq = (requestSeqRef.current += 1);
    const currentSeq = seq;
    
    setLoading(true);
    let url = `${baseUrl}/api/v1/wallet_transaction_all/?page=${page}&page_size=${perPage}`;
    
    const params = new URLSearchParams();
    
    if (customerName) {
      params.append('customer_name', customerName);
    }
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    fetch(url, {
      headers: { Authorization: `${token}` },
      signal: abortController.signal,
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
        if (currentSeq !== requestSeqRef.current) return; // Ignore stale response
        
        if (data && data.results) {
          setData(data.results);
          setTotalRows(data.count || 0);
        } else if (data && Array.isArray(data)) {
          setData(data);
          setTotalRows(data.length);
        } else {
          setData([]);
          setTotalRows(0);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error("Error fetching wallet transactions:", error);
        if (currentSeq === requestSeqRef.current) {
          setData([]);
          setTotalRows(0);
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [page, perPage, customerName, startDate, endDate, update, token]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Update customerName from debouncedSearch
  useEffect(() => {
    if (debouncedSearch.length < 3) {
      if (debouncedSearch.length === 0) {
        setCustomerName("");
      } else {
        return;
      }
    } else {
      setCustomerName(debouncedSearch);
    }
    if (urlInitRef.current) {
      setPage(1);
    }
  }, [debouncedSearch]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    
    const nextQuery = {};
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (startDate) nextQuery.start_date = startDate;
    if (endDate) nextQuery.end_date = endDate;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, startDate, endDate, page, perPage]);

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "العنوان",
      selector: (row) => [row?.title],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {row?.title}
        </div>
      ),
    },
    {
      name: "اسم العميل",
      selector: (row) => [row?.customer?.name],
      cell: (row) => (

        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/users/${row.customer?.id}/`}
        >
          {row?.customer?.name}
        </Link>
      ),
      sortable: true,
    },
    {
      name: "الجوال",
      selector: (row) => [row?.customer?.mobile],
      sortable: true,
      cell: (row) => <div>{row?.customer?.mobile}</div>,
    },
    {
      name: "المبلغ",
      selector: (row) => [row?.amount],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto' dir='ltr'>
            {row?.amount?.toFixed(2)}
          </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "تاريخ التحويل",
      selector: (row) => [row?.created_at],
      sortable: true,
      cell: (row) => <div dir='ltr'>{row?.created_at}</div>,
    },
    user_type === "ADM" || isCanUpdate ?
    {
      name: "عكس العملية",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            setOperationPopup(true);
            setOperationData(row);
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> عكس العملية</Tooltip>}
          >
            <i className='ti ti-loop btn'></i>
          </OverlayTrigger>
        </div>
      ),
    }:'',
  ];

  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='سجلات التحويل' />

      <PageHeader
        title='سجلات التحويل'
        item='شركة وحيد'
        active_item='سجلات التحويل'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "5px" }}>
                  <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                    <label className='main-content-label my-auto '>
                      سجلات التحويل
                      <button 
                        disabled={loading}
                        onClick={() => forceUpdate()} 
                        style={{ width: "50px" }} 
                        className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" 
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16">
                          <path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" />
                          <path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" />
                        </svg>
                      </button>
                    </label>
                    
                    <div className="d-flex gap-2 flex-wrap">
                      <Form.Control
                        type="text"
                        placeholder="البحث عن العميل..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "200px" }}
                        
                      />
                      <Form.Control
                        type="date"
                        placeholder="تاريخ البداية"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ width: "150px" }}
                        disabled={loading}
                      />
                      <Form.Control
                        type="date"
                        placeholder="تاريخ النهاية"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ width: "150px" }}
                        disabled={loading}
                      />
                      {(customerName || startDate || endDate) && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setCustomerName("");
                            setStartDate("");
                            setEndDate("");
                            setSearch("");
                            setDebouncedSearch("");
                            setPage(1);
                          }}
                          disabled={loading}
                        >
                          إعادة تعيين
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    data={data}
                    defaultSortAsc={false}
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
                    noDataComponent="لا توجد سجلات تحويل"
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>

      {operationPopup && (
        <ReversePopup
          setOperationPopup={setOperationPopup}
          operationData={operationData}
          adminId={adminId}
          forceUpdate={forceUpdate}
          token={token}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
