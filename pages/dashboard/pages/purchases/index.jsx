import React, { useEffect, useReducer, useState, useRef } from "react";
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
import { Close } from "@mui/icons-material";

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main styles
import "react-date-range/dist/theme/default.css"; // Theme styles
const user = getUserCookies();

const Orders = () => {
  // Track URL changes to re-initialize when navigating back
  const [urlKey, setUrlKey] = useState(0);
  const [data, setData] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [visibleInputs, setVisibleInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [sended, setSended] = useState(false);
  const [sendReq, setSendReq] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedAlreadyTransferred, setSelectedAlreadyTransferred] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanUpdateAndConfirmRecite, setIsCanUpdateAndConfirmRecite] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [start, setStart] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date("2024-01-01"), // Start of the year 2024
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow's date
      key: "selection",
    },
  ]);
  const [end, setEnd] = useState('');
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات الشراء'
      );
      const canUpdateAndConfirmRecite = componentPermissions?.some((permission) => permission.display_name === 'تأكيد وتعديل مبلغ الإيصال');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      setIsCanUpdateAndConfirmRecite(canUpdateAndConfirmRecite);
      setIsCanUpdate(canUpdate);
    }
  }, [user]);
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
    setSended(false);
    setSelectedEmployee(null);
  }
  const handleStatusChange = (e) => {
    setIsFilterModified(true)
    setSelectedStatus(e.target.value);
  };

  const handlePackageChange = (e) => {
    setIsFilterModified(true)
    setSelectedPackage(e.target.value);
  };
  const handleAlreadyTransferredChange = (e) => {
    setIsFilterModified(true)
    setSelectedAlreadyTransferred(e.target.value);
  };
  const getSalesEmployees = async () => {
    const res = await fetch(`${baseUrl}/api/v1/list_sale_employee/`, {

      headers: {
        Authorization: token,

      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    setSalesEmployees(result);
  };

  const getPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/package_search/?admin_id=${adminId}&page_size=1000`, {
        headers: {
          Authorization: token,
        },
      });
      
      if (res.status === 401) {
        logout();
        return;
      }
      
      const result = await res.json();
      if (result && result.results) {
        setPackages(result.results);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoadingPackages(false);
    }
  };
  const getFormatedTime = (dateTimeString) => {
    console.log(dateTimeString);
    const dateTime = new Date(dateTimeString);

    // Get the date in the desired format
    const date = dateTime.toISOString().split("T")[0];

    // Get the time in the desired format
    const time = dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

    // Concatenate date and time with a space in between
    const formattedDateTime = `  ${time} ${date}`;
    return formattedDateTime

  };

  const sendPurchacesToSaleEmployee = async () => {
    if (checkedList?.length > 0 && selectedEmployee) {
      setLoading(true);
      const res = await fetch(
        `${baseUrl}/api/v1/admin/sale_employee_purchase/`,
        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: selectedEmployee,
            purchase: checkedList,
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
        if (result.error.match('already assigned')) {

          toast.error("  لقد تم اسناد العملية بالفعل");
        } else toast.error(result.error)
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

  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setLoadingPurchases(true)
      const seq = (requestSeqRef.current += 1);
      const controller = new AbortController();
      if (user_type === "SALE") {

        fetch(
          `${baseUrl}/api/v1/sale_employee/list_new_purchase/?status=${selectedStatus}`, {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }

        )
          .then((res) => {
            if (res.status === 401) {
              logout();
              return;
            }
            return res.json();
          })
          .then((data) =>{
            if (seq !== requestSeqRef.current) return; // stale
            if (data && data.data && data.data.purchase) {
              setData(data.data.purchase)
            } else {
              setData([]);
            }
            setLoadingPurchases(false)
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            console.error("Error fetching purchases:", error);
            setLoadingPurchases(false);
          });

      } else {
        let url = `${baseUrl}/api/v1/get_new_purchases/?status=${selectedStatus}&search=${debouncedSearch}&page=${page}&start_date=${start}&end_date=${end}&page_size=${perPage}&admin_id=${adminId}&already_transfered=${selectedAlreadyTransferred}`;
        
        if (selectedPackage) {
          url += `&package_id=${selectedPackage}`;
        }

        fetch(url, {
          headers: { "Authorization": token, "Content-Type": "application/json" },
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
            if (data && data.results) {
              setData(data.results)
              setTotalRows(data.count || 0);
            } else {
              setData([]);
              setTotalRows(0);
            }
            setLoadingPurchases(false)
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            console.error("Error fetching purchases:", error);
            setData([]);
            setTotalRows(0);
            setLoadingPurchases(false);
          });
      }
      return () => controller.abort();
    }
  }, [update, user_type, selectedStatus, selectedPackage, selectedAlreadyTransferred, page, start, end, debouncedSearch, perPage]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Initialize from URL (apply to state first, enable fetching after commit)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're on the index page
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath === '/dashboard/pages/purchases' || currentPath.startsWith('/dashboard/pages/purchases');
    if (!isIndexPage) return;
    
    // If already initialized, check if URL params changed (e.g., from back navigation)
    if (urlInitRef.current) {
      // Re-read URL params in case they changed (e.g., from browser back)
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qStatus = params.get('status');
      const qPackage = params.get('package_id');
      const qStart = params.get('start');
      const qEnd = params.get('end');
      const qSearch = params.get('search');
      
      // Update state if URL params differ from current state
      if (qPage && !Number.isNaN(Number(qPage)) && Number(qPage) !== page) {
        setPage(Number(qPage));
      }
    if (qStatus !== null && qStatus !== selectedStatus) {
        setSelectedStatus(qStatus || '');
      }
    const qAlreadyTransferred = params.get('already_transfered');
    if (qAlreadyTransferred !== null && qAlreadyTransferred !== selectedAlreadyTransferred) {
      setSelectedAlreadyTransferred(qAlreadyTransferred || '');
    }
      if (qPackage !== null && qPackage !== selectedPackage) {
        setSelectedPackage(qPackage || '');
      }
      if (qStart !== null && qStart !== start) {
        setStart(qStart || '');
      }
      if (qEnd !== null && qEnd !== end) {
        setEnd(qEnd || '');
      }
      if (qSearch !== null && qSearch !== search) {
        setSearch(qSearch);
        setDebouncedSearch(qSearch);
      }
      return;
    }
    
    // Initial initialization
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    const qStatus = params.get('status');
    const qAlreadyTransferred = params.get('already_transfered');
    const qPackage = params.get('package_id');
    const qStart = params.get('start');
    const qEnd = params.get('end');
    
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
      const nextPage = Number(qPage);
      if (nextPage !== page) setPage(nextPage);
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      const nextPerPage = Number(qPageSize);
      if (nextPerPage !== perPage) setPerPage(nextPerPage);
      paramsChanged = true;
    }
    if (typeof qStatus === 'string' && qStatus.length > 0) {
      if (qStatus !== selectedStatus) setSelectedStatus(qStatus);
      paramsChanged = true;
    }
    if (typeof qAlreadyTransferred === 'string' && qAlreadyTransferred.length > 0) {
      if (qAlreadyTransferred !== selectedAlreadyTransferred) setSelectedAlreadyTransferred(qAlreadyTransferred);
      paramsChanged = true;
    }
    if (typeof qPackage === 'string' && qPackage.length > 0) {
      if (qPackage !== selectedPackage) setSelectedPackage(qPackage);
      paramsChanged = true;
    }
    if (typeof qStart === 'string' && qStart.length > 0) {
      if (qStart !== start) setStart(qStart);
      paramsChanged = true;
    }
    if (typeof qEnd === 'string' && qEnd.length > 0) {
      if (qEnd !== end) setEnd(qEnd);
      paramsChanged = true;
    }

    // Mark that we've applied URL params; a subsequent effect will enable fetching
    didInitFromUrlRef.current = true;
  }, [urlKey]); // Re-run when URL changes (triggered by popstate listener)
  
  // Listen for browser back/forward to re-initialize from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handlePopState = () => {
      // When browser back/forward is pressed, re-read URL params
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath === '/dashboard/pages/purchases' || currentPath.startsWith('/dashboard/pages/purchases');
        if (isIndexPage) {
          // Reset initialization to allow re-reading URL params
          urlInitRef.current = false;
          didInitFromUrlRef.current = false;
          // Trigger re-initialization
          setUrlKey(prev => prev + 1);
        }
      }, 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // After URL params have been applied to state, enable fetching exactly once
  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      // Trigger fetch with correct params
      forceUpdate();
    }
  }, [page, perPage, selectedStatus, selectedPackage, selectedAlreadyTransferred, start, end, debouncedSearch]);
  

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    if (selectedStatus) nextQuery.status = selectedStatus;
    if (selectedPackage) nextQuery.package_id = selectedPackage;
    if (selectedAlreadyTransferred) nextQuery.already_transfered = selectedAlreadyTransferred;
    if (start) nextQuery.start = start;
    if (end) nextQuery.end = end;
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, page, perPage, selectedStatus, selectedPackage, selectedAlreadyTransferred, start, end]);

  useEffect(() => {
    // Only execute if URL initialization is complete
    if (urlInitRef.current) {
      user_type === "ADM" || isCanUpdate ? getSalesEmployees() : ''
      getPackages();
    }
  }, [page, urlInitRef.current]);
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
      case "ready_for_sale":
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
          {user_type === "ADM" && sendReq && (
            <>
              <span className="w-25 ">{checkedList.indexOf(row.id) !== -1 ? checkedList.indexOf(row.id) + 1 : null}</span>


              {
                row.sale_admins?.length > 0 ? (
                  visibleInputs[row.id] ? (
                    // Show input if it's visible for this row
                    <input
                      type="checkbox"
                      className="w-100"
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
                    className="w-100"
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
          <Link className='font-weight-bold d-flex align-items-center  gap-2 ms-2'
            href={`/dashboard/pages/purchases/${row?.id}/`}
            onClick={() => {
              // Store current URL with filters before navigating to details
              if (typeof window !== 'undefined') {
                const currentUrl = window.location.pathname + window.location.search;
                sessionStorage.setItem('purchasesIndexUrl', currentUrl);
              }
            }}
          >
            <span style={{ width: '50px' }}>{row?.id}</span>
          </Link>
        </span>
      ),
      width: sendReq ? '200px' : '120px'
    },
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={`/dashboard/pages/purchases/${row?.id}/`}
          onClick={() => {
            // Store current URL with filters before navigating to details
            if (typeof window !== 'undefined') {
              const currentUrl = window.location.pathname + window.location.search;
              sessionStorage.setItem('purchasesIndexUrl', currentUrl);
            }
          }}
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
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/users/${row?.user_id}/`}
          onClick={() => {
            // Store current URL with filters before navigating to user details
            if (typeof window !== 'undefined') {
              const currentUrl = window.location.pathname + window.location.search;
              sessionStorage.setItem('purchasesIndexUrl', currentUrl);
            }
          }}
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
      name: "اّيبان ",
      selector: (row) => [row?.user?.iban],
      sortable: true,
      cell: (row) => (
        <div>{row?.user?.iban}</div>
      ),
      width: '180px'
    },
    {
      name: "سبق له التحويل",
      selector: (row) => [row?.already_transfered],
      sortable: true,
      cell: (row) => {
        const alreadyTransferred = row?.already_transfered;
        return (
          <div className={`font-weight-bold ${alreadyTransferred ? "text-success" : "text-danger"}`}>
            {alreadyTransferred ? "نعم" : "لا"}
          </div>
        );
      },
      width: '150px'
    },

    {
      name: "الباقة",
      selector: (row) => [row?.Package?.title],
      cell: (row) =>
        row?.Package && (
          <Link
            className='font-weight-bold'
            href={`/dashboard/pages/packages/${row?.Package?.id}/`}
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
      name: "موظفوا المبيعات",
      selector: (row) => row?.sale_employees, // Ensures selector points to sale_employees
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterModified, setIsFilterModified] = useState(false);
  const handleApply = () => {
    const start = dateRange[0].startDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    const end = dateRange[0].endDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    setStart(start)
    setEnd(end)
    setShowDatePicker(false);
    setIsFilterModified(true);
  };
  const resetFilter = () => {
    setDateRange([
      {
        startDate: new Date("2024-01-01"), // Reset to start of 2024
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Reset to tomorrow
        key: "selection",
      },

    ]);
    setStart("2024-01-01");
    setEnd(
      new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0]
    );
    setSelectedStatus('')
    setSelectedPackage('')
    setSelectedAlreadyTransferred('')
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

  return (
    <>
      <Seo title='عمليات الشراء' />

      <PageHeader
        title='عمليات الشراء'
        item='شركة وحيد'
        active_item='عمليات الشراء'
      />

      <div>
        {/* <!-- Row --> */}

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
                      عمليات الشراء
                      <button disabled={loadingPurchases} onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>

                  </div>
                  <div className="dd-flex flex-wrap gap-2">

                    {user_type === "ADM" || isCanUpdate ?
                      (sendReq ? (
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
                                  checkedList?.length < 1 ||
                                  !selectedEmployee
                                  ? true
                                  : false
                              }
                              onClick={sendPurchacesToSaleEmployee}
                            >
                              {loading ? "جاري الإرسال..." : "إرسال الطلبات"}
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
                          تعيين طلبات لموظف المبيعات
                        </Button>
                      )) : ''}

                    <Button className="mt-2 mt-md-0 ms-md-2" onClick={exportToExcel}>Export to Excel</Button>
                  </div>


                </div>
                <div className="d-flex  align-items-end mt-4  gap-2">

                  <Form.Group className='text-start form-group  mt-2' controlId='formPackage'>
                    <Form.Label> فرز عن طرق الحالة</Form.Label>
                    <Form.Select
                    disabled={loadingPurchases}
                      className='form-control ps-5 text-muted'
                      name='categories'
                      value={selectedStatus} // Assuming you have state for the selected package
                      onChange={(e) => handleStatusChange(e)}
                      required
                    >
                      {/* Placeholder option */}

                      <option value=""> الكل...</option>
                      <option value="UPLOADED_FILE">تم رفع الإيصال</option>
                      <option value="PAID_PARTIALLY">مدفوع جزئيا</option>
                      <option value="NEW">جديد غير مدفوع</option>
                      <option value="SOLD_PARTIALLY">مبيعة جزئيا</option>
                      <option value="PAYMENT_INITIATED">تمت محاولة الدفع</option>
                      <option value="PAID">مدفوعة</option>
                      <option value="REJECTED">مرفوضة</option>
                      <option value="SOLD">مبيعة كاملة</option>
                      <option value="PENDING">انتظار</option>
                      <option value="CANCELLED">ملغية</option>
                      <option value="ready_for_sale">جاهزة للبيع</option>
                      <option value="attention">بحاجة معالجة</option>


                    </Form.Select>
                  </Form.Group>

                  <Form.Group className='text-start form-group  mt-2' controlId='formPackageFilter'>
                    <Form.Label> فرز عن طريق الباقة</Form.Label>
                    <Form.Select
                      disabled={loadingPurchases || loadingPackages}
                      className='form-control ps-5 text-muted'
                      name='packageFilter'
                      value={selectedPackage}
                      onChange={(e) => handlePackageChange(e)}
                      required
                    >
                      <option value=""> جميع الباقات...</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                <Form.Group className='text-start form-group  mt-2' controlId='formAlreadyTransferred'>
                  <Form.Label>سبق له التحويل</Form.Label>
                  <Form.Select
                    disabled={loadingPurchases}
                    className='form-control ps-5 text-muted'
                    name='alreadyTransfered'
                    value={selectedAlreadyTransferred}
                    onChange={(e) => handleAlreadyTransferredChange(e)}
                    required
                  >
                    <option value=""> الكل...</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                  </Form.Select>
                </Form.Group>
                  <Row className="mb-3 d-flex justify-content-start gap-2 w-50">
                    <Col className="w-100 d-flex gap-2" >
                      <Button
                      disabled={loadingPurchases}
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
                        <Button disabled={loadingPurchases} variant="danger" onClick={resetFilter}>
                          إعادة تعيين
                        </Button>
                      )}
                    </Col>
                    <Col className="w-fit" lg={3} md={6}></Col>
                  </Row>
                </div>
              </Card.Header>
              <Card.Body className="pos-relative">
                <input
                  type='text'
                  className='search-input'
                  style={{ top: '30px' }}
                  placeholder='بحث'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {console.log('page ', totalRows)
                }
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationDefaultPage={page}
                    onChangePage={(newPage) => {
                      if (Number(newPage) !== Number(page)) setPage(Number(newPage));
                    }}
                    paginationPerPage={perPage}
                    onChangeRowsPerPage={(newPerPage, nextPage) => {
                      const willChangePerPage = Number(newPerPage) !== Number(perPage);
                      const willChangePage = Number(nextPage) !== Number(page);
                      if (willChangePerPage) setPerPage(Number(newPerPage));
                      if (willChangePage) setPage(Number(nextPage));
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={loadingPurchases || !urlInitRef.current}
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

Orders.layout = "Contentlayout";

export default Orders;
