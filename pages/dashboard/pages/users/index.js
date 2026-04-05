import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, OverlayTrigger, Row, Accordion, FormSelect, Form, Nav } from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import * as XLSX from 'xlsx';
import { Close } from "@mui/icons-material";

import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
// images
import stop from "../../../../public/assets/img/stop.png";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import { toast } from "react-toastify";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main styles
import "react-date-range/dist/theme/default.css"; // Theme styles

const user = getUserCookies();
const SuspendPopup = ({ setSuspendPopup, userData, loading, suspendUser }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من إيقاف المستخدم : {userData?.name}</h4>
          <img src={stop.src} alt='stop' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => suspendUser(userData.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الايقاف ..." : "إيقاف"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSuspendPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const SendMobileRequestPopup = ({
  setSendMobileRequestPopup,
  userData,
  loading,
  sendMyUserRequest,
}) => {

  const [orderNumber, setOrderNumber] = useState()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [countryCode, setCountryCode] = useState([]);
  const [selectedCode, setSelectedCode] = useState(1); // Default to Saudi Arabia
  const [mobile, setMobile] = useState();
  useEffect(() => {


    const fetchCountryCode = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/country-code/`, {

        });
        const data = await res.json();


        setCountryCode(data);

      } catch (error) {
        console.error("Error fetching :", error);
      }
    };

    fetchCountryCode();
  }, []);


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-2 translate-middle-y translate-middle-x w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "320px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4> تسجيل عميل  </h4>
          <Form.Group className='text-start form-group'>
            <Form.Label>الجوال</Form.Label>
            <div className="d-flex gap-1">
              <Form.Select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="form-control w-25"
                style={{ paddingRight: '35px', paddingLeft: "5px" }}
              >
                {countryCode.map((country) => (
                  <option key={country.id} value={country.id} className="p-4">
                    ({country.code})
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                className='form-control'
                placeholder='ادخل جوال العميل '
                name='mobile'
                type='number'
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

          </Form.Group>

          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={() => sendMyUserRequest(selectedCode, mobile)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التسجيل ..." : "تسجيل"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSendMobileRequestPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
const SendMyOrderPopup = ({
  setSendMyOrderPopup,
  userData,
  loading,
  sendMyOrder,
}) => {

  const [orderNumber, setOrderNumber] = useState()


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-2 translate-middle-y translate-middle-x w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "320px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4> تسجيل طلب جديد </h4>
          <Form.Group
            className='text-start form-group mt-4'
            controlId='formpassword'
          >
            <Form.Label>رقم الطلب</Form.Label>
            <Form.Control
              className='form-control'
              placeholder='ادخل رقم الطلب '
              name='orderNumber'
              type='text'
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </Form.Group>

          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={() => sendMyOrder(orderNumber)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التسجيل ..." : "تسجيل"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSendMyOrderPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const DeletePopup = ({ setDeletePopup, userData, loading, deleteUser }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من حذف المشرف : {userData?.name}</h4>
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

const Orders = () => {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [sendMyOrderPopup, setSendMyOrderPopup] = useState(false);
  const [sendMobileRequestPopup, setSendMobileRequestPopup] = useState(false);
  const [sended, setSended] = useState(false);
  const [sendReq, setSendReq] = useState(false);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checkedList, setCheckedList] = useState([]);
  const [visibleInputs, setVisibleInputs] = useState({});
  const [statistics, setStatistics] = useState({});
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const { token, id: adminId, user_type } = user;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowFiles, setIsCanShowFiles] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [isFilterModified, setIsFilterModified] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [activeTab, setActiveTab] = useState("NEW");
  const initializedRef = useRef(false);
  const searchInitRef = useRef(false);
  const urlInitRef = useRef(false);
  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'العملاء'
      );



      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
      const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const canShowFiles = componentPermissions?.some((permission) => permission.display_name === 'عرض المستندات');

      setIsCanAdd(canAdd);
      setIsCanDelete(canDelete);
      setIsCanUpdate(canUpdate);
      setIsCanShowFiles(canShowFiles);
    }
  }, [user]);

  const [start, setStart] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString("en-CA"));
  const [end, setEnd] = useState(new Date().toLocaleDateString("en-CA"));
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Default: Last 30 days
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const handleApply = () => {
    const start = dateRange[0].startDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    const end = dateRange[0].endDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    setStart(start)
    setEnd(end)
    setShowDatePicker(false);
    setIsFilterModified(true);
  };
  const resetFilter = () => {
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30));
    const defaultEndDate = new Date();
    
    setDateRange([
      {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        key: "selection",
      },
    ]);
    
    // Set start and end to match dateRange values in YYYY-MM-DD format
    setStart(defaultStartDate.toISOString().split('T')[0]);
    setEnd(defaultEndDate.toISOString().split('T')[0]);
    setSelectedStatus('')
    setIsSendToEmployee('')
    // Reset your filtered data here
    setIsFilterModified(false);
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };
  const handleRecentDateSelection = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        startDate = new Date(today.setDate(today.getDate() - 1));
        endDate = new Date(today.setDate(today.getDate()));
        break;
      case "lastWeek":
        startDate = new Date(today.setDate(today.getDate() - 7));
        endDate = new Date();
        break;
      case "last30Days":
        startDate = new Date(today.setDate(today.getDate() - 30));
        endDate = new Date();
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last3Months":
        startDate = new Date(today.setMonth(today.getMonth() - 3));
        endDate = new Date();
        break;
      case "currentYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;

      default:
        startDate = new Date(new Date().setDate(new Date().getDate() - 30));
        endDate = new Date();
    }

    setDateRange([
      {
        startDate,
        endDate,
        key: "selection",
      },
    ]);
    setIsFilterModified(true);
  };
  const toggleInputVisibility = (rowId) => {
    setVisibleInputs((prevVisibleInputs) => ({
      ...prevVisibleInputs,
      [rowId]: !prevVisibleInputs[rowId], // Toggle visibility for the specific row
    }));
    console.log('visibleInputs', visibleInputs);

  };
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  function reset() {
    setSendReq(false);
    setCheckedList([]);
    setVisibleInputs({});
    setSended(false);
    setSelectedEmployee(null);
  }
  const [selectedStatus, setSelectedStatus] = useState('');
  const [issSendToEmployee, setIsSendToEmployee] = useState('');
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setIsFilterModified(true);
  };
  const handleSendToEmployeeChange = (e) => {
    setIsSendToEmployee(e.target.value);
    setIsFilterModified(true);
  };
  const getSalesEmployees = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/list_sale_employee/`, {
        headers: {
          Authorization: token,
        },
      });
      
      if (res.status == 401) {
        logout();
        return;
      }
      
      const result = await res.json();
      setSalesEmployees(result);
      
      // Initialize state from URL after employees are loaded
      if (typeof window !== 'undefined' && !initializedRef.current) {
        const params = new URLSearchParams(window.location.search);
        const qSearch = params.get('search');
        const qPage = params.get('page');
        const qPageSize = params.get('page_size');
        const qHavePurchases = params.get('have_purchases');
        const qAssignedToSale = params.get('assigned_to_sale_admin');
        const qStatus = params.get('status');
        const qStart = params.get('start');
        const qEnd = params.get('end');

        if (typeof qSearch === 'string' && qSearch.length > 0) {
          setSearch(qSearch);
          setDebouncedSearch(qSearch);
          searchInitRef.current = true;
        }
        if (typeof qPage === 'string' && !Number.isNaN(Number(qPage))) setPage(Number(qPage));
        if (typeof qPageSize === 'string' && !Number.isNaN(Number(qPageSize))) setPerPage(Number(qPageSize));
        if (typeof qHavePurchases === 'string') setSelectedStatus(qHavePurchases);
        if (typeof qAssignedToSale === 'string') setIsSendToEmployee(qAssignedToSale);
        if (typeof qStatus === 'string') setActiveTab(qStatus);
        if (typeof qStart === 'string' && typeof qEnd === 'string') {
          setStart(qStart);
          setEnd(qEnd);
          setDateRange([
            {
              startDate: new Date(qStart),
              endDate: new Date(qEnd),
              key: "selection",
            },
          ]);
        }

        initializedRef.current = true;
        urlInitRef.current = true;
        // Ensure fetch runs with initialized filters
        forceUpdate();
      }
    } catch (error) {
      console.error("Error fetching sales employees:", error);
    }
  };
  useEffect(() => {
    // Call getSalesEmployees if user has permission, otherwise initialize URL params directly
    if (user_type === "ADM" || isCanUpdate) {
      getSalesEmployees();
    } else if (typeof window !== 'undefined' && !initializedRef.current) {
      // Initialize URL params for users without permission to get sales employees
      const params = new URLSearchParams(window.location.search);
      const qSearch = params.get('search');
      const qPage = params.get('page');
      const qPageSize = params.get('page_size');
      const qHavePurchases = params.get('have_purchases');
      const qAssignedToSale = params.get('assigned_to_sale_admin');
      const qStatus = params.get('status');
      const qStart = params.get('start');
      const qEnd = params.get('end');

      if (typeof qSearch === 'string' && qSearch.length > 0) {
        setSearch(qSearch);
        setDebouncedSearch(qSearch);
        searchInitRef.current = true;
      }
      if (typeof qPage === 'string' && !Number.isNaN(Number(qPage))) setPage(Number(qPage));
      if (typeof qPageSize === 'string' && !Number.isNaN(Number(qPageSize))) setPerPage(Number(qPageSize));
      if (typeof qHavePurchases === 'string') setSelectedStatus(qHavePurchases);
      if (typeof qAssignedToSale === 'string') setIsSendToEmployee(qAssignedToSale);
      if (typeof qStatus === 'string') setActiveTab(qStatus);
      if (typeof qStart === 'string' && typeof qEnd === 'string') {
        setStart(qStart);
        setEnd(qEnd);
        setDateRange([
          {
            startDate: new Date(qStart),
            endDate: new Date(qEnd),
            key: "selection",
          },
        ]);
      }

      initializedRef.current = true;
      urlInitRef.current = true;
      // Ensure fetch runs with initialized filters
      forceUpdate();
    }
    
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      if (user_type === "ADM" || user_type === "ACC") {
        fetch(`${baseUrl}/api/v1/get_customer/?have_purchases=${selectedStatus}&assigned_to_sale_admin=${issSendToEmployee}&search=${debouncedSearch}&page=${page}&page_size=${perPage}`, {
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
            console.log('fdfdfdfdfdfd', data.results);
            data.results && setData(data.results.filter((d) => d.user_type === "CUS"));
            setTotalRows(data.count);
          });
      }
      if (user_type === "SALE") {
        fetch(`${baseUrl}/api/v1/sale_admin_customer/?status=${activeTab}&search=${debouncedSearch}`, {
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
          .then((data) => setData(data));
      }
    }

  }, [selectedStatus, update, isCanUpdate, issSendToEmployee, page, activeTab, end ,start, debouncedSearch]);
  useEffect(() => {
    const skipMinLength = searchInitRef.current;
    if (!skipMinLength && debouncedSearch.length < 3) {
      // If search term is less than 3 characters, do nothing
      if (debouncedSearch.length == 0) {
        setSearch('')
      }
      else return;
    }
    if (searchInitRef.current) {
      searchInitRef.current = false;
    } else {
      setPage(1)
    }
    user_type === "ADM" || isCanUpdate ? getSalesEmployees() : ''
    
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      if (user_type === "ADM" || user_type === "ACC") {
        fetch(`${baseUrl}/api/v1/get_customer/?have_purchases=${selectedStatus}&assigned_to_sale_admin=${issSendToEmployee}&search=${debouncedSearch}&page=${page}&page_size=${perPage}`, {
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
            data.results && setData(data.results.filter((d) => d.user_type === "CUS"));
            setTotalRows(data.count);
          });
      }
      if (user_type === "SALE") {
        fetch(`${baseUrl}/api/v1/sale_admin_customer/?status=${activeTab}`, {
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
          .then((data) => setData(data));
      }
    }

  }, [debouncedSearch]);

  // URL initialization will be handled in the getSalesEmployees function
  // This ensures filters are applied after employee data is loaded

  // Debounce search input for smoother UX
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync URL with current filters/pagination/search/date range WITHOUT routing (only after init)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;

    const nextQuery = {};

    // Common params
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);

    if (user_type === "ADM" || user_type === "ACC") {
      if (selectedStatus !== '') nextQuery.have_purchases = selectedStatus;
      if (issSendToEmployee !== '') nextQuery.assigned_to_sale_admin = issSendToEmployee;
    }

    if (user_type === "SALE") {
      if (activeTab && activeTab !== 'NEW') nextQuery.status = activeTab;
      if (start) nextQuery.start = start;
      if (end) nextQuery.end = end;
    }

    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;

    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, selectedStatus, issSendToEmployee, page, perPage, activeTab, start, end, user_type, isFilterModified]);
  const sendPurchacesToSaleEmployee = async () => {
    if (checkedList?.length > 0 && selectedEmployee) {
      setLoading(true);
      const res = await fetch(

        `${baseUrl}/api/v1/sale_admin_customer/${selectedEmployee}/assign-customers/`,

        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // user: selectedEmployee,
            customers: checkedList,
          }),
        },
      );
      if (res.status == 401) {
        logout()
      }
      const result = await res.json();
      console.log(result);
      if (result.success) {
        toast.success(`تم إرسال ${checkedList?.length} طلب`);
        forceUpdate();
        reset();
      } else {
        toast.error(result.message || "حدث خطأ ما, حاول مرة اخرى");
      }
      setCheckedList([]);
      setLoading(false);
      setSended(true);
      reset();
    } else {
      toast.error("الرجاء تحديد طلب واحد على الاقل");
      toast.error("الرجاء تحديد الموظف ");
    }
  };
  const toggleVerification = (status, id) => {
    const base = status ? false : true
    fetch(`${baseUrl}/api/v1/admin_users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        is_verified: base
      }),
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
        "Accept": "application/json"

      }
    })
      .then((res) => {
        if (res.status === 401) {
          // logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success(data.message)
        }
        else toast.error(data.error)

        forceUpdate()
      })
      .catch((err) => toast.error(err.error));

  }

  useEffect(() => {


    fetch(`${baseUrl}/api/v1/list_sale_employee/${adminId}/?date_range_start=${start}&date_range_end=${end}`, {
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
        setStatistics(data.statistics);
        console.log(data);

      });







  }, [update , end ,start]);
  const sendMyOrder = (number) => {

    fetch(`${baseUrl}/api/v1/sale-admin-confirmed-purchase/`, {
      method: "POST",
      body: JSON.stringify({
        purchase_id: number
      }),
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
        "Accept": "application/json"

      }
    })
      .then((res) => {
        if (res.status === 401) {
          // logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success(data.message)
          setSendMyOrderPopup(false)
        }
        else toast.error(data.message)

        forceUpdate()
      })
      .catch((err) => toast.error(err.error));

  }
  const sendMyUserRequest = (customer_country_code, customer_mobile) => {

    fetch(`${baseUrl}/api/v1/sale-admin-customer-requests/`, {
      method: "POST",
      body: JSON.stringify({
        customer_country_code,
        customer_mobile,
      }),
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
        "Accept": "application/json"

      }
    })
      .then((res) => {
        if (res.status === 401) {
          // logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log('ljkljkljkjkljjkljk', data);
        if (data.success) {
          toast.success(data.message)
          setSendMobileRequestPopup(false)
        }
        else toast.error(data.message)

        forceUpdate()
      })
      .catch((err) => toast.error(err.error));

  }
  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => (
        <span className="d-flex w-100 align-items-center">
          {(user_type === "ADM" || isCanAdd) && sendReq && (
            <>
              <span className="" style={{ width: '10px' }}>{checkedList.indexOf(row.id) !== -1 ? checkedList.indexOf(row.id) + 1 : null}</span>

              {
                row.sale_admins?.length > 0 ? (
                  visibleInputs[row.id] ? (
                    // Show input if it's visible for this row
                    <input
                      type="checkbox"
                      style={{ width: "25px", height: "20px" }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedList([...checkedList, row?.id]);
                        } else {
                          setCheckedList(checkedList?.filter((c) => c !== row?.id));
                        }
                      }}
                      checked={checkedList.includes(row?.id)}
                    />
                  ) : (
                    // Show button if input is not visible
                    <button
                      className="btn btn-primary"
                      onClick={() => toggleInputVisibility(row.id)}
                    >
                      اعادة اسناد
                    </button>
                  )
                ) : (
                  <input
                    type="checkbox"

                    style={{ width: "25px", height: "20px" }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedList([...checkedList, row?.id]);
                      } else {
                        setCheckedList(checkedList?.filter((c) => c !== row?.id));
                      }
                    }}
                    checked={checkedList.includes(row?.id)}
                  />
                )}

            </>
          )}
          <Link className='font-weight-bold text-start d-flex align-items-center gap-2 ms-2'
            href={``}
          >
            <span style={{ width: '30px' }}>{row.id ? row.id : row.customer.id}</span>
          </Link>
          {
            row.customer ? (


              !row.customer.is_verified ?
                <button
                  className=" btn-danger_ p-1"

                >
                  غير موثق
                </button> : ''
            )

              :
              (
                !row.is_verified ?
                  <button
                    className=" btn-danger_ p-1"

                  >
                    غير موثق
                  </button> : ''

              )


          }
        </span>
      ),
      width: sendReq ? '250px' : '150px'
    },

    {
      name: "الاسم",
      selector: (row) => [row.name],
      sortable: true,
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/users/${row.id}/`}
        >
          {row?.name ? row?.name : row?.customer?.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row.mobile],
      cell: (row) => <div className='font-weight-bold'>

        {row?.mobile ? row?.mobile : row?.customer?.mobile} {''}
        <span dir="ltr">{row?.mobile ? row?.country_code?.code : row?.customer?.country_code?.code}</span>
        <img className="ms-1" src={`${baseUrl}/${row?.mobile ? row?.country_code?.flag_image : row?.customer?.country_code?.flag_image}`} alt="" style={{ width: '30px' }} />

      </div>,
      sortable: true,
      width: '200px'
    },
    {
      name: "الهوية",
      selector: (row) => [row.national_id],
      sortable: true,
      cell: (row) => <div>{row?.national_id ? row?.national_id : row?.customer?.national_id}</div>,
      width: '150px'
    },
    user_type !== "SALE" &&
    {
      name: "اسم موظف المبيعات",
      selector: (row) => [row.national_id],
      sortable: true,
      cell: (row) => <div>

        {
          row.sale_admins?.map((admin, i) => {
            return <div key={i}> {i + 1}- {admin.admin.name}</div>
          })
        }
      </div>,
      width: '200px'
    },
    user_type == "SALE" &&
    {
      name: " النوع",
      selector: (row) => [row.source],
      sortable: true,
      cell: (row) => <div>
        {row?.source == "ASSIGN" ? 'تعيين ' : 'طلب '}
      </div>,
      width: '100px'
    },
    {
      name: "هل مشترك في باقة",
      selector: (row) => [row.mobile],
      cell: (row) => <div className='font-weight-bold'>{row?.have_packages ? "نعم" : "لا"}</div>,
      sortable: true,
      width: '150px'
    },
    {
      name: "تاريخ التسجيل",
      selector: (row) => [row.Date],
      sortable: true,
      cell: (row) => {
        const date = new Date(row?.customer?.datetime_created ? row?.customer?.datetime_created : row?.datetime_created);
        const readableDate = date.toLocaleString({
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, // Set to false for 24-hour format
        });
        return <div>{readableDate}</div>;
      }
      ,
      width: '180px'
    },
    {
      name: " التوثيق",
      selector: (row) => [row.is_verified],
      sortable: true,
      cell: (row) => <Button
        onClick={() => {
          toggleVerification(row?.is_verified, row?.id)
        }}
      >
        {row?.is_verified ? ' إلغاء  التوثيق' : " توثيق"}
      </Button>,

      width: '150px'
    },



    ,
  ];
  console.log(data);
  const tableData = {
    columns,
    data,
  };
  const changeNumberFormate = (number, type) => {
    const changedNumber = new Intl.NumberFormat().format(number);
    if (type === "float") {
      const splitedNumber = changedNumber.split(".");
      let newNumber;
      if (splitedNumber[1] > 0) {
        if (splitedNumber[1].length === 1) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1] + "00";
        } else if (splitedNumber[1].length === 2) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1] + "0";
        } else if (splitedNumber[1].length === 3) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1];
        }
      } else {
        newNumber = splitedNumber[0] + ".00";
      }
      return newNumber;
    } else if (type === "int") {
      return changedNumber;
    }
  };
  return (
    <>
      <Seo title='العملاء' />

      <PageHeader title='العملاء' item='شركة وحيد' active_item='العملاء' />

      <div>
        {/* <!-- Row --> */}
        {
          user_type === "SALE" &&
          <Row className="mb-3 d-flex justify-content-start gap-2">
            <Col className="w-fit d-flex gap-2" lg={3} md={6}>
              <Button
                variant="outline-primary"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {dateRange[0].startDate.toLocaleDateString()} -{" "}
                {dateRange[0].endDate.toLocaleDateString()}
              </Button>
              {showDatePicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    zIndex: 1000,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    gap: "16px",
                  }}
                >


                  {/* Right Side: Date Picker */}
                  <div style={{ flex: 1 }}>
                    {/* Header with Start and End Dates */}
                    <div className="d-flex justify-content-between mb-3 gap-2">
                      <div>
                        <label>تاريخ البداية</label>
                        <input
                          type="text"
                          readOnly
                          value={dateRange[0].startDate.toLocaleDateString()}
                          className="form-control"
                        />
                      </div>
                      <div>
                        <label>تاريخ النهاية</label>
                        <input
                          type="text"
                          readOnly
                          value={dateRange[0].endDate.toLocaleDateString()}
                          className="form-control w-100"
                        />
                      </div>
                    </div>

                    {/* Date Picker */}
                    <DateRange
                      onChange={(ranges) => {
                        setDateRange([ranges.selection]);
                        setIsFilterModified(true);
                      }}
                      ranges={dateRange}
                      rangeColors={["#007bff"]}
                      showDateDisplay={false}
                      className="custom-date-range w-100"
                    />

                    {/* Buttons */}
                    <div className="d-flex justify-content-end mt-3 gap-2">
                      <Button variant="secondary" onClick={handleCancel}>
                        الغاء
                      </Button>
                      <Button variant="primary" onClick={handleApply}>
                        تطبيق
                      </Button>
                    </div>
                  </div>
                  {/* Left Side: Recent Date Options */}
                  <div style={{ width: "130px" }}>
                    <h6>اختر فترة زمنية</h6>
                    <div className="d-flex flex-column gap-2">
                      <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("today")}>
                        اليوم
                      </Button>
                      <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("yesterday")}>
                        أمس
                      </Button>
                      <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("lastWeek")}>
                        الأسبوع الماضي
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleRecentDateSelection("last30Days")}
                      >
                        آخر 30 يوم
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleRecentDateSelection("lastMonth")}
                      >
                        الشهر الماضي
                      </Button>
                      <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("last3Months")}>
                        3 أشهر
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleRecentDateSelection("lastYear")}
                      >
                        آخر سنة
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleRecentDateSelection("currentYear")}
                      >
                        من بداية السنة الحالية
                      </Button>


                    </div>
                  </div>
                </div>
              )}
              {isFilterModified && (
                <Button variant="danger" onClick={resetFilter}>
                  إعادة تعيين
                </Button>
              )}
            </Col>
            <Col className="w-fit" lg={3} md={6}></Col>
          </Row>

        }
        {
          user_type === "SALE" &&
          <>
            <Row className='row-sm '>
              <Col sm={12} md={6} lg={6} xl={3}>
                <Card className='custom-card'>
                  <Card.Body>
                    <div className='card-order '>
                      <label className='main-content-label mb-3 ' style={{ textAlign: "center", width: "100%" }}>

                      إجمالي عمليات الشراء لأول مرة عن طريق عرض                      </label>
                      <h2 className='text-center card-item-icon card-icon'>
                        <i className='mdi mdi-cube icon-size  text-primary'></i>
                        <br /><br />
                        <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold mt-2'>
                          {console.log(';;;;;;;;;', statistics)
                          }
                          {changeNumberFormate(statistics?.total_user_paid_first_time_offer, "int")}
                        </span>
                      </h2>
                      {/* <p className='mb-0 mt-4 text-muted'>
                            آخر 30 يوما<span className='float-end'>50%</span>
                          </p> */}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={12} md={6} lg={6} xl={3}>
                <Card className='custom-card'>
                  <Card.Body>
                    <div className='card-order '>
                      <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                      إجمالي عمليات الشراء المكررة عن طريق عرض                      </label>
                      <h2 className='text-center card-item-icon card-icon'>
                        <i className='mdi mdi-cube icon-size  text-primary'></i>
                        <br /><br />
                        <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                          {console.log(';;;;;;;;;', statistics)
                          }
                          {changeNumberFormate(statistics?.total_user_paid_offer, "int")}
                        </span>
                      </h2>
                      {/* <p className='mb-0 mt-4 text-muted'>
                            آخر 30 يوما<span className='float-end'>50%</span>
                          </p> */}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col sm={12} md={6} lg={6} xl={3}>
                <Card className='custom-card'>
                  <Card.Body>
                    <div className='card-order '>
                      <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                        إجمالي قيمة الشراء لأول مرة عن طريق عملاء مسندون
                      </label>
                      <h2 className='text-center card-item-icon card-icon'>
                        <i className='mdi mdi-cube icon-size  text-primary'></i>
                        <br /><br />
                        <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                          {console.log(';;;;;;;;;', statistics)
                          }
                          {changeNumberFormate(statistics?.total_user_paid_first_time, "int")}
                        </span>
                      </h2>
                      {/* <p className='mb-0 mt-4 text-muted'>
                            آخر 30 يوما<span className='float-end'>50%</span>
                          </p> */}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={12} md={6} lg={6} xl={3}>
                <Card className='custom-card'>
                  <Card.Body>
                    <div className='card-order '>
                      <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                        إجمالي قيمة الشراء المكررة عن طريق عملاء مسندون
                      </label>
                      <h2 className='text-center card-item-icon card-icon'>
                        <i className='mdi mdi-cube icon-size  text-primary'></i>
                        <br /><br />
                        <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                          {console.log(';;;;;;;;;', statistics)
                          }
                          {changeNumberFormate(statistics?.total_user_paid, "int")}
                        </span>
                      </h2>
                      {/* <p className='mb-0 mt-4 text-muted'>
                            آخر 30 يوما<span className='float-end'>50%</span>
                          </p> */}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={12} md={6} lg={6} xl={3}>
                <Card className='custom-card'>
                  <Card.Body>
                    <div className='card-order '>
                      <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                        عدد العملاء المسندين
                      </label>
                      <h2 className='text-center card-item-icon card-icon'>
                        <i className='mdi mdi-account-multiple icon-size  text-primary'></i>
                        <br /><br />
                        <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                          {console.log(';;;;;;;;;', statistics)
                          }
                          {changeNumberFormate(statistics?.sale_employee_users_count, "int")}
                        </span>
                      </h2>
                      {/* <p className='mb-0 mt-4 text-muted'>
                            آخر 30 يوما<span className='float-end'>50%</span>
                          </p> */}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className='row-sm'>
              <Col md={12} lg={12}>
                <Card className=' custom-card'>
                  {/* <Card.Header className=' border-bottom-0 '>
                    <div>
                      <div className='mb-4'>
                        <label className='main-content-label my-auto '>
                          {`عمليات الموظف : ${employee?.name}`}
                        </label>
                      </div>

                      <div className='d-flex justify-content-between'>
                        <h5 className='py-2 flex-1'>
                          البريد الالكتروني : {employee?.email}
                        </h5>
                        <h5 className='py-2 flex-1'>
                          رقم الجوال : {employee?.mobile}
                        </h5>
                        <h5 className='py-2 flex-1'>
                          {" "}
                          الهوية : {employee?.national_id}
                        </h5>
                      </div>
                    </div>
                  </Card.Header> */}



                  <Card.Body>
                    <div className='mb-4'>
                      <label className='main-content-label my-auto'>
                        العملاء وعمليات الشراء
                      </label>
                    </div>
                    <div className='accordion-container'>
                      <Accordion defaultActiveKey="0">
                        {statistics?.assigned_users_with_purchases?.length > 0 ?
                          statistics?.assigned_users_with_purchases?.map((item, index) => (
                            <Accordion.Item eventKey={index.toString()} key={item.id}>
                              <Accordion.Header>
                                <h5 className="mb-0"> {item?.user?.id} </h5> - <h5 className="mb-0"> {item?.user?.name} </h5> - <h5 className="mb-0"> {item?.user?.mobile} </h5>
                              </Accordion.Header>
                              <Accordion.Body>
                                {item?.purchases?.length > 0 ? item?.purchases?.map((purchase) => (
                                  <div
                                    key={purchase?.id}
                                    style={{
                                      padding: "10px 20px",
                                      // border: "1px solid #ddd",
                                      marginBottom: "8px",
                                      borderRadius: "8px",
                                      boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.2)",
                                    }}
                                  >
                                     بإجمالي: {" "}
                                    <strong>{purchase?.total_price?.toLocaleString()} ريال</strong>
                                    {' '}
                                    -
                                    تاريخ الاسحقاق:{' '}{purchase?.deserve_sale_date}
                                  </div>
                                )) : <div className="d-flex justify-content-center align-items-center p-4">لا يوجد طلبات شراء</div>}
                              </Accordion.Body>
                            </Accordion.Item>
                          ))
                          :
                          <div className="d-flex justify-content-center align-items-center p-5">لا يوجد طلبات</div>
                        }
                      </Accordion>
                    </div>
                  </Card.Body>



                  {/* <Card.Body>
                    <div className='mb-4'>
                      <label className='main-content-label my-auto '>
                        {` العملاء `}
                      </label>
                    </div>
                    <DataTableExtensions {...tableUserData}>
                      <DataTable
                        columns={columnsUsers}
                        defaultSortAsc={false}
                        // striped={true}
                        pagination
                      />
                    </DataTableExtensions>
                  </Card.Body> */}

                </Card>
              </Col>
            </Row>
          </>

        }
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                {
                  user_type === "SALE" &&
                  <Nav

                    variant="tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4 w-50"
                  >
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="NEW"
                        className={activeTab === "NEW" ? "active bg-primary text-white" : ""}
                      >
                        العملاء الجدد
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="mx-2 border rounded">
                      <Nav.Link
                        eventKey="OLD"
                        className={activeTab === "OLD" ? "active bg-primary text-white" : ""}
                      >
                        عملاء سابقون
                      </Nav.Link>
                    </Nav.Item>

                  </Nav>
                }
                <div style={{ marginBottom: "0px" }}>

                  <div className='d-flex justify-content-between  flex-wrap'>
                    <label className='main-content-label my-auto '>
                      العملاء المسجلون
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>

                      </button>

                    </label>
                    <div className="gap-2 d-flex">

                      {user_type === "ADM" || isCanUpdate ?
                        (sendReq ? (
                          <div className="mt-2 mt-md-0">
                            <div className='d-flex gap-3 align-items-center'>
                              <h5 className='font-weight-bold'>
                                {checkedList?.length < 1
                                  ? "يجب تحديد العملاء"
                                  : ` عدد العملاء (${checkedList?.length})`}
                              </h5>
                              <Button
                                disabled={
                                  loading ||
                                    checkedList?.length < 1 ||
                                    !selectedEmployee
                                    ? true
                                    : false
                                }
                                onClick={sendPurchacesToSaleEmployee}
                              >
                                {loading ? "جاري الإرسال..." : "إرسال العملاء"}
                              </Button>
                              <button
                                onClick={reset}
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
                            </div>
                            <div>
                              <FormSelect
                                className='mt-3 ps-5'
                                value={selectedEmployee}
                                onChange={(e) =>
                                  setSelectedEmployee(e.target.value)
                                }
                              >
                                <option value={null} selected>
                                  اختر الموظف
                                </option>
                                {salesEmployees?.map((employee) => (
                                  <option key={employee?.id} value={employee?.id}>
                                    {employee?.name}
                                  </option>
                                ))}
                              </FormSelect>
                            </div>
                          </div>
                        ) : (
                          <Button className="mt-2 mt-md-0" onClick={() => setSendReq(true)}>
                            تعيين عملاء لموظف المبيعات
                          </Button>
                        ))
                        :
                        ''
                      }

                      {user_type === "SALE" && <Button className="mt-2 mt-md-0 ms-md-2" onClick={() => setSendMyOrderPopup(true)}>تسجيل طلب تم عن طريقي</Button>}
                      {user_type === "SALE" && <Button className="mt-2 mt-md-0 ms-md-2" onClick={() => setSendMobileRequestPopup(true)}> طلب تسجيل عميل  </Button>}
                      <Button className="mt-2 mt-md-0 ms-md-2" onClick={exportToExcel}>Export to Excel</Button>
                    </div>



                  </div>
                  {
                    user_type === "ADM" &&

                    <div className="d-flex justify-content-start align-items-center flex-wrap gap-2 mt-4">

                      <Form.Group className='text-start form-group  ' controlId='formPackage'>
                        <Form.Label> فرز عن طرق عمليات الشراء</Form.Label>
                        <Form.Select
                          className='form-control ps-5 text-muted'
                          name='categories'
                          value={selectedStatus} // Assuming you have state for the selected package
                          onChange={(e) => handleStatusChange(e)}
                          required
                        >
                          {/* Placeholder option */}

                          <option value=""> الكل...</option>
                          <option value="false">ليس لديه عمليات شراء  </option>
                          <option value="true">  لديه عمليات شراء</option>



                        </Form.Select>
                      </Form.Group>
                      <Form.Group className='text-start form-group   ' controlId='formPackage'>
                        <Form.Label> فرز    الموظفين الذين تم إرسالهم إلى موظف المبيعات</Form.Label>
                        <Form.Select
                          className='form-control ps-5 text-muted'
                          name='categories'
                          value={issSendToEmployee} // Assuming you have state for the selected package
                          onChange={(e) => handleSendToEmployeeChange(e)}
                          required
                        >
                          {/* Placeholder option */}

                          <option value=""> الكل...</option>
                          <option value="true">   تم إرسالهم إلى موظف   </option>
                          <option value="false">    لم يتم إرسالهم</option>



                        </Form.Select>
                      </Form.Group>
                      {isFilterModified && (
                        <Button variant="danger" onClick={resetFilter}>
                          إعادة تعيين
                        </Button>
                      )}

                    </div>
                  }

                </div>

              </Card.Header>


              <Card.Body className="pos-relative">
                {
                  user_type === "ADM" || user_type === "ACC" ?
                    <input
                      type='text'
                      className='search-input'
                      style={{ top: '30px' }}
                      placeholder='بحث'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    /> : ''
                }
                {
                  user_type === "SALE" ?
                    <input
                      type='text'
                      className='search-input'
                      style={{ top: '30px' }}
                      placeholder='بحث بالاسم او الجوال او رقم الهوية'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    /> : ''
                }
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={(page) => setPage(page)}
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
        {/* <!-- End Row --> */}
      </div>
      {suspendPopup && (
        <SuspendPopup
          loading={loading}
          setSuspendPopup={setSuspendPopup}
          userData={userData}
          suspendUser={suspendUser}
        />
      )}
      {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteUser={deleteUser}
        />
      )}
      {sendMyOrderPopup && (
        <SendMyOrderPopup
          loading={loading}
          setSendMyOrderPopup={setSendMyOrderPopup}
          userData={userData}
          sendMyOrder={sendMyOrder}
        />
      )}
      {sendMobileRequestPopup && (
        <SendMobileRequestPopup
          loading={loading}
          setSendMobileRequestPopup={setSendMobileRequestPopup}
          userData={userData}
          sendMyUserRequest={sendMyUserRequest}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
