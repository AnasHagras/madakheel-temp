import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Nav,
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
import Link from "next/link";
import { toast } from "react-toastify";
// images
import * as XLSX from 'xlsx';
import trash from "../../../../public/assets/img/trash.png";
import checkUserType from "../../../../utils/checkUserType";
import { useRouter } from "next/router";

const DeletePopup = ({ setDeletePopup, userData, loading, deleteUser }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من حذف الباقة : {userData?.title}</h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => deleteUser(userData?.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الحذف ..." : "حذف"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setDeletePopup(false)}
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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [addPackagePopup, setAddPackagePopup] = useState(false);
  const [activeTab, setActiveTab] = useState("visible")
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id, user_type } = user;
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanAddPurchase, setIsCanAddPurchase] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [availabilityCountryFilter, setAvailabilityCountryFilter] = useState("");
  const urlInitRef = useRef(false);
  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'الباقات'
      );
      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const canAddPurchase = componentPermissions?.some((permission) => permission.display_name === "تسجيل بيع");
      setIsCanAdd(canAdd);
      setIsCanUpdate(canUpdate);
      setIsCanAddPurchase(canAddPurchase);
    }
  }, [user]);
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  const [isLoading, setIsLoading] = useState(false);
  const requestSeqRef = useRef(0);
  
  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setIsLoading(true);
      const seq = (requestSeqRef.current += 1);
      const controller = new AbortController();
      let url = `${baseUrl}/api/v1/package_search/?admin_id=${id}&page=${page}&page_size=${perPage}&search=${debouncedSearch}`;
      
      // Add filters based on active tab
      if (activeTab === "visible") {
        // Show only visible packages (default)
        url += `&is_hidden=false`;
      } else if (activeTab === "hidden") {
        // Show only hidden packages
        url += `&is_hidden=true`;
      } else if (activeTab === "deleted") {
        // Show only deleted packages
        url += `&show_deleted=true`;
      } else if (activeTab === "all") {
        // Show all packages (visible + hidden + deleted)
        url += `&show_deleted=true&show_hidden=true`;
      }

      // Add availability country filter
      if (availabilityCountryFilter) {
        url += `&availability_country=${availabilityCountryFilter}`;
      }

      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        signal: controller.signal,
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (seq !== requestSeqRef.current) return; // stale
          if (data && data.results) {
            setData(data.results);
            setTotalRows(data.count);
          } else {
            setData([]);
            setTotalRows(0);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error("Error fetching packages:", error);
          setData([]);
          setTotalRows(0);
          setIsLoading(false);
        });
      return () => controller.abort();
    }
  }, [update, page, activeTab, availabilityCountryFilter, perPage, debouncedSearch]);

  // Initialize from URL on first load (apply to state first, then enable fetching)
  const didInitFromUrlRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    const qTab = params.get('tab');
    const qCountry = params.get('availability_country');
    
    // Track if any parameters were changed from defaults
    let paramsChanged = false;
    
    if (typeof qSearch === 'string' && qSearch.length > 0) {
      if (qSearch !== search) {
        setSearch(qSearch);
        setDebouncedSearch(qSearch);
      }
      paramsChanged = true;
    }
    if (qPage && !Number.isNaN(Number(qPage))) {
      const next = Number(qPage);
      if (next !== page) setPage(next);
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      const next = Number(qPageSize);
      if (next !== perPage) setPerPage(next);
      paramsChanged = true;
    }
    if (typeof qTab === 'string' && qTab.length > 0) {
      if (qTab !== activeTab) setActiveTab(qTab);
      paramsChanged = true;
    }
    if (typeof qCountry === 'string' && qCountry.length > 0) {
      if (qCountry !== availabilityCountryFilter) setAvailabilityCountryFilter(qCountry);
      paramsChanged = true;
    }
    
    didInitFromUrlRef.current = true;
  }, []);

  // After URL params have been applied to state, enable fetching exactly once
  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      // Trigger fetch with correct params
      forceUpdate();
    }
  }, [page, perPage, activeTab, availabilityCountryFilter, debouncedSearch]);
  

  // Debounce search input
  useEffect(() => {
    // Skip initial debounce if we're initializing from URL
    if (search !== debouncedSearch || !urlInitRef.current) {
      const handler = setTimeout(() => setDebouncedSearch(search), 400);
      return () => clearTimeout(handler);
    }
  }, [search, debouncedSearch]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    if (activeTab && activeTab !== 'visible') nextQuery.tab = activeTab;
    if (availabilityCountryFilter) nextQuery.availability_country = availabilityCountryFilter;
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, page, perPage, activeTab, availabilityCountryFilter]);

  const addPackage = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    const { price, title, desc, quantity, profit, commission, files } = data;

    const fd = new FormData();
    fd.append("price", price);
    fd.append("title", title);
    fd.append("shortdescription", desc);
    fd.append("quantity", quantity);
    fd.append("profit", profit);
    fd.append("commission", commission);
    fd.append("admin_id", id);
    files?.length > 0 && fd.append("image_file", files[0]);

    const res = await fetch(`${baseUrl}/api/v1/package/`, {
      method: "POST",
      body: fd,
      headers: {
        Authorization: c,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();

    if (res.status === 201 && result.success) {
      toast.success("تم الإضافة بنجاح");
      forceUpdate();
      setAddPackagePopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);
    e.target.reset();
  };

  const columns = [
    {
      name: "المعرف",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id} </div>,
    },

    {
      name: "العنوان",
      selector: (row) => [row.title],
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/packages/${row.id}/`}
        >
          {row.title} 
          <span className={'text-danger ms-1'}>
            {row?.is_hidden ? 'مخفية' : ""}
            {row?.is_deleted ? 'محذوفة' : ""}
          </span>
        </Link>
      ),
      sortable: true,
    },
    {
      name: "السعر",
      selector: (row) => [row.price],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>{row.price.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      ),
    },
    {
      name: "الكمية",
      selector: (row) => [row.quantity],
      sortable: true,
      cell: (row) => <div>{row.quantity}</div>,
    },
    {
      name: "نسبة الربح",
      selector: (row) => [row.profit],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.customer_net_profit_percentage.toFixed(3)}%</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "الحد الاقصي للشراء ",
      selector: (row) => [row.quantity],
      sortable: true,
      cell: (row) => <div>{row.has_limit  ? row?.limit_per_user   :   'لا يوجد'}</div>,
    },
    {
      name: "دولة التوفر",
      selector: (row) => [row.availability_country],
      sortable: true,
      cell: (row) => (
        <div>
          {row.availability_country === 'uae' && 'الإمارات'}
          {row.availability_country === 'saudi' && 'السعودية'}
          {row.availability_country === 'both' && 'كلاهما'}
        </div>
      ),
    },

    {
      name: "تاريخ اللإنشاء",
      selector: (row) => [row.datetime],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
            {new Date(row.datetime).toLocaleDateString()}
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

  const isAdmin = checkUserType();

  const router = useRouter();

  return (
    <>
      <Seo title='الباقات' />

      <PageHeader title='الباقات' item='شركة وحيد' active_item='الباقات' />

      <div>

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10 '>
                <div className="d-flex align-items-center justify-content-between flex-wrap">

                  <Nav
                    variant="tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4 "
                  >
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="visible"
                        className={activeTab === "visible" ? "active bg-primary text-white" : ""}
                      >
                        ظاهرة
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="hidden"
                        className={activeTab === "hidden" ? "active bg-primary text-white" : ""}
                      >
                        مخفية
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="deleted"
                        className={activeTab === "deleted" ? "active bg-primary text-white" : ""}
                      >
                        محذوفة
                      </Nav.Link>
                    </Nav.Item>
           
                  </Nav>
                  <div className="d-flex flex-wrap gap-2">
                  <Form.Select
                    value={availabilityCountryFilter}
                    onChange={(e) => setAvailabilityCountryFilter(e.target.value)}
                    style={{ width: "220px" , paddingRight: "40px" }}
                  >
                   
                    <option value="">كل الدول المتوفرة </option>
                    <option value="uae">الإمارات</option>
                    <option value="saudi">السعودية</option>
                  </Form.Select>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                    
                    {isAdmin === true || isCanAdd ? (

                      <Button
                        onClick={() =>
                          router.push("/dashboard/pages/add-package")
                        }
                      >
                        إضافة باقة جديدة
                      </Button>
                    ) : (
                      <div className='py-3'></div>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: "-5px" }}>
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      الباقات
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>



                  </div>

                </div>
              </Card.Header>
              <Card.Body className="pos-relative">
                <input
                  type='text'
                  className='search-input'
                  placeholder='بحث'
                  style={{ top: '30px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
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

      {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteUser={deletePopup}
        />
      )}

      {addPackagePopup && (
        <AddPackagePopup
          loading={loading}
          setAddPackagePopup={setAddPackagePopup}
          addPackage={addPackage}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const AddPackagePopup = ({ setAddPackagePopup, addPackage, loading }) => {
  const [price, setPrice] = useState(null);
  const [profit, setProfit] = useState(null);
  const [commission, setCommission] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [files, setFiles] = useState(null);
  const [title, setTitle] = useState(null);
  const [desc, setDesc] = useState(null);


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3>باقة جديدة</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              addPackage(e, {
                price,
                profit,
                commission,
                files,
                quantity,
                title,
                desc,
              })
            }
          >
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>العنوان</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل العنوان'
                name='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>السعر بدون الضريبة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل السعر بدون الضريبة '
                name='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>نسبة الربح</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل نسبة الربح'
                name='profit'
                type='number'
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label> نسبة العمولة من الربح</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='نسبة العمولة من الربح'
                name='commission'
                type='number'
                max={100}
                min={0}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>الكمية الأولية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الكمية الأولية'
                name='quantity'
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label> إرفاق صورة الباقة </Form.Label>
              <Form.Control
                className='form-control'
                name='files'
                type='file'
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
            </Form.Group>
            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>الوصف</Form.Label>
              <textarea
                className='form-control'
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={5}
                placeholder='ادخل الوصف'
              />
            </Form.Group>
            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإضافة..." : "إضافة باقة جديدة"}
              </Button>
              <Button
                onClick={() => setAddPackagePopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
