import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
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
  const confirmRequest = async () => {
    setLoading(true);

    const fd = new FormData();
   
    fd.append("status ", "PROCESSED");
    const res = await fetch(
      `${baseUrl}/api/v1/admin/transactions-requests/${operationData?.id}/`,
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
          <h4>هل انت متاكد من  تسجيل معالجة الطلب </h4>
          {/* <img
            src={active.src}
            style={{}}
            alt='stop'
            width={80}
            className='my-4'
          /> */}
          <div className='d-flex justify-content-center gap-5 mt-4'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={confirmRequest}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التسجيل ..." : " تسجيل"}
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

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
  useEffect(() => {
      if (user_type === "ACC") {
        const permissions =  JSON.parse(localStorage.getItem("permissions"))
        const componentPermissions = permissions?.filter(
              (permission) => permission.group_name === 'طلبات التحويل'
          );

          const canUpdate = componentPermissions?.some((permission) => permission.display_name === "عكس التحويل");


          setIsCanUpdate(canUpdate);
      }
  }, [user]);
  useEffect(() => {
    if (!urlInitRef.current) return;
    setIsLoading(true);
    const seq = (requestSeqRef.current += 1);
    const controller = new AbortController();

    let url = `${baseUrl}/api/v1/admin/transactions-requests/?page=${page}&page_size=${perPage}`;
    if (debouncedSearch) {
      url += `&search=${encodeURIComponent(debouncedSearch)}`;
    }

    fetch(url, {
      headers: { Authorization: `${token}` },
      signal: controller.signal,
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
        if (seq !== requestSeqRef.current) return; // stale
        // Support both paginated and array responses
        if (data && Array.isArray(data.data)) {
          setData(data.data);
          setTotalRows(data.data.length || 0);
        } else if (data && data.results) {
          setData(data.results);
          setTotalRows(typeof data.count === 'number' ? data.count : (data.results.length || 0));
        } else if (Array.isArray(data)) {
          setData(data);
          setTotalRows(data.length || 0);
        } else {
          setData([]);
          setTotalRows(0);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Error fetching transaction requests:', error);
        setData([]);
        setTotalRows(0);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, update, page, perPage]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Initialize from URL on mount (apply to state first, then enable fetching)
  useEffect(() => {
    if (typeof window === 'undefined' || urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    if (typeof qSearch === 'string' && qSearch.length > 0) {
      if (qSearch !== search) {
        setSearch(qSearch);
        setDebouncedSearch(qSearch);
      }
    }
    if (qPage && !Number.isNaN(Number(qPage))) {
      const next = Number(qPage);
      if (next !== page) setPage(next);
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      const next = Number(qPageSize);
      if (next !== perPage) setPerPage(next);
    }
    didInitFromUrlRef.current = true;
  }, []);

  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      forceUpdate();
    }
  }, [page, perPage, debouncedSearch]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, perPage, debouncedSearch]);

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "الاسم",
      selector: (row) => [row?.title],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {row?.user.name}
        </div>
      ),
    },
 
    {
      name: "الجوال",
      selector: (row) => [row?.user?.mobile],
      sortable: true,
      cell: (row) => <div>{row?.user?.mobile}</div>,
    },
    {
      name: "المستحقات",
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
    // {
    //   name: "تاريخ التحويل",
    //   selector: (row) => [row?.created_at],
    //   sortable: true,
    //   cell: (row) => <div dir='ltr'>{row?.created_at}</div>,
    // },
    user_type === "ADM" || isCanUpdate ?
    {
      name: "تمت المعالجة",
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
            overlay={<Tooltip> تمت المعالجة</Tooltip>}
          >
            <i className='ti ti-check btn'></i>
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
      <Seo title='طلبات التحويل' />

      <PageHeader
        title='طلبات التحويل'
        item='شركة وحيد'
        active_item='طلبات التحويل'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "5px" }}>
                  <div className='d-flex'>
                    <label className='main-content-label my-auto '>
                      طلبات التحويل
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                                               <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                  </div>
                  {/* <input
                    type='text'
                    className='search-input'
                    placeholder='بحث'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  /> */}
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
                    onChangePage={(p) => { if (Number(p) !== Number(page)) setPage(Number(p)); }}
                    paginationPerPage={perPage}
                    onChangeRowsPerPage={(newPerPage, p) => {
                      const willChangePerPage = Number(newPerPage) !== Number(perPage);
                      const willChangePage = Number(p) !== Number(page);
                      if (willChangePerPage) setPerPage(Number(newPerPage));
                      if (willChangePage) setPage(Number(p));
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={isLoading || !urlInitRef.current}
                    progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
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
