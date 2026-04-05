import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Row } from "react-bootstrap";
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
import { useRouter } from "next/router";
import { getUserCookies } from "../../../../utils/getUserCookies";
import { getFormatedTime } from "../../../../utils/getFormatedTime";
import * as XLSX from 'xlsx';
import logout from "../../../../utils/logout";
const user = getUserCookies();

const Sales = () => {
  const router = useRouter();
  const [data, setData] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInitRef = useRef(false);
  const urlInitRef = useRef(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanAdd, setIsCanAdd] = useState(false);


  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات البيع'
      );

      console.log('componentPermissions', componentPermissions);

      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');


      setIsCanAdd(canAdd);
    }
  }, [user]);
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setIsLoading(true);
      let url = `${baseUrl}/api/v1/admin_sale/?page=${page}&page_size=${perPage}&admin_id=${adminId}`;
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      fetch(url, {
        headers: { "Authorization": token, "Content-Type": "application/json" }
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.results) {
            setData(data.results);
            setTotalRows(data.count || 0);
          } else {
            setData([]);
            setTotalRows(0);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching sales:", error);
          setData([]);
          setTotalRows(0);
          setIsLoading(false);
        });
    }
  }, [update, user_type, debouncedSearch, page, perPage]);


  // Initialize from URL on first load (read from window to avoid query flicker)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    
    // Track if any parameters were changed from defaults
    let paramsChanged = false;
    
    if (typeof qSearch === 'string' && qSearch.length > 0) {
      setSearch(qSearch);
      setDebouncedSearch(qSearch);
      searchInitRef.current = true;
      paramsChanged = true;
    }
    if (typeof qPage === 'string' && !Number.isNaN(Number(qPage))) {
      setPage(Number(qPage));
      paramsChanged = true;
    }
    if (typeof qPageSize === 'string' && !Number.isNaN(Number(qPageSize))) {
      setPerPage(Number(qPageSize));
      paramsChanged = true;
    }
    
    // Only after all parameters are set, mark URL as initialized
    urlInitRef.current = true;
    
    // If any params were changed, no need to force update as the dependency array will trigger the fetch
    // Only force update if no params were changed to ensure we fetch at least once
    if (!paramsChanged) {
      forceUpdate();
    }
  }, []);

  // Debounce search input for smoother UX
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync URL with current params WITHOUT routing (only after init)
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
  }, [debouncedSearch, page, perPage]);

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (
        <span>


          <Link className='font-weight-bold d-flex align-items-center gap-2'
            href={`/dashboard/pages/packages/sale/${row?.id}/`}
          >
            <span>{row?.id}</span>
          </Link>

        </span>
      ),
    },

    {
      name: "اسم الباقة",
      selector: (row) => [row?.package_title
      ],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={`/dashboard/pages/packages/${row?.package?.id}/`}
        >
          {row?.package?.title}
        </Link>
      ),
    },

    {
      name: "تاريخ البيع",
      selector: (row) => [row?.created_at],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{getFormatedTime(row?.created_at)}</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "",
      selector: (row) => [row?.created_at],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span>


            <Link className='font-weight-bold d-flex align-items-center gap-2'
              href={`/dashboard/pages/packages/sale/${row?.id}/`}
            >
              <span>عرض تفاصيل العملية</span>
            </Link>

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
      <Seo title='سجل البيع' />

      <PageHeader
        title='سجل البيع'
        item='شركة وحيد'
        active_item='سجل البيع'
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
                      سجل البيع
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
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
                    paginationServer
                    paginationDefaultPage={page}
                    paginationPerPage={perPage}
                    paginationTotalRows={totalRows}
                    onChangePage={(newPage) => {
                      if (newPage !== page) setPage(newPage);
                    }}
                    onChangeRowsPerPage={(newPerPage, nextPage) => {
                      const willChangePerPage = Number(newPerPage) !== Number(perPage);
                      const willChangePage = Number(nextPage) !== Number(page);
                      if (willChangePerPage) setPerPage(Number(newPerPage));
                      if (willChangePage) setPage(Number(nextPage));
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
    </>
  );
};

Sales.layout = "Contentlayout";

export default Sales;
