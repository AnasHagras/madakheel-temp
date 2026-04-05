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
import { Close, Check, Cancel } from "@mui/icons-material";

import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main styles
import "react-date-range/dist/theme/default.css"; // Theme styles
const user = getUserCookies();

const DelayedOrders = () => {
  const [data, setData] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDelayedOrders, setLoadingDelayedOrders] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [days, setDays] = useState(120); // Default 120 days (filter value used in requests)
  const [daysInput, setDaysInput] = useState("120"); // UI input value, committed on blur only
  const [selectionOrder, setSelectionOrder] = useState([]); // Track selection order
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
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
  
  // Approved data state
  const [approvedData, setApprovedData] = useState([]);
  const [checkedApprovedList, setCheckedApprovedList] = useState([]);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [pageApproved, setPageApproved] = useState(1);
  const [totalRowsApproved, setTotalRowsApproved] = useState(0);
  const [perPageApproved, setPerPageApproved] = useState(50);
  const [approvedSelectionOrder, setApprovedSelectionOrder] = useState([]); // Track approved selection order

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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "delayed-orders.xlsx");
  };

  const handlePackageChange = (e) => {
    setSelectedPackage(e.target.value);
  };

  const handleDaysChange = (e) => {
    // Update only the input value; do not change the actual filter yet
    setDaysInput(e.target.value);
  };

  const handleDaysBlur = () => {
    // Commit input to the actual filter on blur
    const parsed = parseInt(daysInput, 10);
    const nextDays = Number.isNaN(parsed) || parsed <= 0 ? 120 : parsed;
    if (nextDays !== days) {
      setDays(nextDays);
      // Trigger fetch after committing
      forceUpdate();
    }
  };

  // Keep the UI input in sync when days changes from URL or reset
  useEffect(() => {
    setDaysInput(String(days));
  }, [days]);

  // Inline the getDelayedOrders function into useEffect

  // Inline the getApprovedSales function into useEffect

  const handleGroupSelling = async () => {
    if (checkedList?.length > 0) {
      setLoading(true);
      try {
        const res = await fetch(
          `${baseUrl}/api/v1/admin_group_selling/`,
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              purchase_ids: checkedList,
              days:days
            }),
          },
        );
        
        if (res.status === 401) {
          logout();
          return;
        }
        
        const result = await res.json();
        console.log(result);
        
        if (result.success) {
          toast.success(result.message || `تم بيع ${checkedList?.length} طلب بنجاح`);
          forceUpdate();
          setCheckedList([]);
          setSelectionOrder([]);
        } else {
          toast.error(result.error || "حدث خطأ أثناء البيع");
        }
      } catch (error) {
        console.error("Error in group selling:", error);
        toast.error( "حدث خطأ أثناء البيع");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("الرجاء تحديد طلب واحد على الأقل");
    }
  };

  // Helper function to handle sequential selection for delayed orders
  const handleSequentialSelection = (rowId, isChecked) => {
    if (isChecked) {
      // Check if this is the next item in sequence
      const currentOrder = [...selectionOrder];
      const nextIndex = currentOrder.length;
      
      // Find the index of this row in the data array
      const rowIndex = data.findIndex(row => row.id === rowId);
      
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

  // Helper function to handle sequential selection for approved sales
  const handleApprovedSequentialSelection = (rowId, isChecked) => {
    if (isChecked) {
      // Check if this is the next item in sequence
      const currentOrder = [...approvedSelectionOrder];
      const nextIndex = currentOrder.length;
      
      // Find the index of this row in the approved data array
      const rowIndex = approvedData.findIndex(row => row.preview_sale?.id === rowId);
      
      if (rowIndex === nextIndex) {
        // This is the correct next item to select
        setCheckedApprovedList([...checkedApprovedList, rowId]);
        setApprovedSelectionOrder([...currentOrder, rowId]);
      } else {
        // Show error message
        toast.error(`يجب تحديد الصف رقم ${nextIndex + 1} أولاً`);
        return false;
      }
    } else {
      // Unchecking - handle cascading deselection
      const deselectedIndex = approvedSelectionOrder.findIndex(id => id === rowId);
      
      if (deselectedIndex !== -1) {
        // Remove the deselected item and all items after it
        const newSelectionOrder = approvedSelectionOrder.slice(0, deselectedIndex);
        const newCheckedList = checkedApprovedList.filter(id => 
          newSelectionOrder.includes(id)
        );
        
        setCheckedApprovedList(newCheckedList);
        setApprovedSelectionOrder(newSelectionOrder);
        
        // Show info message about cascading deselection
        const removedCount = approvedSelectionOrder.length - deselectedIndex;
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

  // Helper function to get approved selection order number
  const getApprovedSelectionOrder = (rowId) => {
    const orderIndex = approvedSelectionOrder.findIndex(id => id === rowId);
    return orderIndex !== -1 ? orderIndex + 1 : null;
  };

  const handleApprovedAction = async (action) => {
    if (checkedApprovedList?.length > 0) {
      setLoading(true);
      try {
        let url;
        
        if (action === 'sell') {
          url = `${baseUrl}/api/v1/admin_group_selling/sell/`;
        } else if (action === 'cancel') {
          url = `${baseUrl}/api/v1/admin_group_selling/cancel/`;
        }
        
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preview_sale_ids: checkedApprovedList,
          }),
        });
        
        if (res.status === 401) {
          logout();
          return;
        }
        
        const result = await res.json();
        console.log(result);
        
        if (result.success) {
          toast.success(result.message || `تم ${action === 'sell' ? 'البيع' : 'الإلغاء'} بنجاح`);
          setCheckedApprovedList([]);
          setApprovedSelectionOrder([]);
          getApprovedSales();
        } else {
          toast.error(result.error || `حدث خطأ أثناء ${action === 'sell' ? 'البيع' : 'الإلغاء'}`);
        }
      } catch (error) {
        console.error(`Error in ${action}:`, error);
        toast.error(`حدث خطأ أثناء ${action === 'sell' ? 'البيع' : 'الإلغاء'}`);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("الرجاء تحديد طلب واحد على الأقل");
    }
  };

  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setLoadingDelayedOrders(true);
      
      let url = `${baseUrl}/api/v1/get_new_purchases/?admin_id=${adminId}&status=group_selling&days=${days}&page=${page}&page_size=${perPage}`;
      
      if (selectedPackage) {
        url += `&package_id=${selectedPackage}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      if (start) {
        url += `&start_date=${start}`;
      }
      if (end) {
        url += `&end_date=${end}`;
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
          if (data && data.results) {
            setData(data.results);
            setTotalRows(data.count || 0);
          }
          setLoadingDelayedOrders(false);
        })
        .catch((error) => {
          console.error("Error fetching delayed orders:", error);
          setData([]);
          setTotalRows(0);
          setLoadingDelayedOrders(false);
        });
    }
  }, [update, selectedPackage, page, start, end, debouncedSearch, perPage, days]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Initialize from URL
  useEffect(() => {
    if (typeof window === 'undefined' || urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const qSearch = params.get('search');
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    const qPackage = params.get('package_id');
    const qDays = params.get('days');
    const qStart = params.get('start');
    const qEnd = params.get('end');
    const qApprovedPage = params.get('approved_page');
    const qApprovedPageSize = params.get('approved_page_size');
    
    // Track if any parameters were changed from defaults
    let paramsChanged = false;
    
    if (qSearch) {
      setSearch(qSearch);
      setDebouncedSearch(qSearch);
      paramsChanged = true;
    }
    if (qPage && !Number.isNaN(Number(qPage))) {
      setPage(Number(qPage));
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      setPerPage(Number(qPageSize));
      paramsChanged = true;
    }
    if (qPackage) {
      setSelectedPackage(qPackage);
      paramsChanged = true;
    }
    if (qDays && !Number.isNaN(Number(qDays))) {
      setDays(Number(qDays));
      paramsChanged = true;
    }
    if (qStart) {
      setStart(qStart);
      paramsChanged = true;
    }
    if (qEnd) {
      setEnd(qEnd);
      paramsChanged = true;
    }
    if (qApprovedPage && !Number.isNaN(Number(qApprovedPage))) {
      setPageApproved(Number(qApprovedPage));
      paramsChanged = true;
    }
    if (qApprovedPageSize && !Number.isNaN(Number(qApprovedPageSize))) {
      setPerPageApproved(Number(qApprovedPageSize));
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
  

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    if (selectedPackage) nextQuery.package_id = selectedPackage;
    if (days && days !== 120) nextQuery.days = String(days);
    if (start) nextQuery.start = start;
    if (end) nextQuery.end = end;
    if (pageApproved && pageApproved !== 1) nextQuery.approved_page = String(pageApproved);
    if (perPageApproved && perPageApproved !== 50) nextQuery.approved_page_size = String(perPageApproved);
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, page, perPage, selectedPackage, days, start, end, pageApproved, perPageApproved]);

  useEffect(() => {
    // Only execute if URL initialization is complete
    if (urlInitRef.current) {
      // Fetch packages
      setLoadingPackages(true);
      try {
        fetch(`${baseUrl}/api/v1/package_search/?admin_id=${adminId}&page_size=1000`, {
          headers: {
            Authorization: token,
          },
        })
        .then(res => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then(result => {
          if (result && result.results) {
            setPackages(result.results);
          }
          setLoadingPackages(false);
        })
        .catch(error => {
          console.error("Error fetching packages:", error);
          setLoadingPackages(false);
        });
      } catch (error) {
        console.error("Error fetching packages:", error);
        setLoadingPackages(false);
      }
    }
  }, [urlInitRef.current]);

  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setLoadingApproved(true);
      
      const url = `${baseUrl}/api/v1/admin_group_selling/approved/?page=${pageApproved}&page_size=${perPageApproved}`;

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
          if (data && data.results) {
            setApprovedData(data.results);
            setTotalRowsApproved(data.count || 0);
          }
          setLoadingApproved(false);
        })
        .catch((error) => {
          console.error("Error fetching approved sales:", error);
          setApprovedData([]);
          setTotalRowsApproved(0);
          setLoadingApproved(false);
        });
    }
  }, [pageApproved, perPageApproved, update]);

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
        const selectionNumber = getSelectionOrder(row?.id);
        return (
          <span className="d-flex w-100">
            <span className="w-25">
              <input
                type="checkbox"
                className="w-100"
                onChange={(e) => {
                  handleSequentialSelection(row?.id, e.target.checked);
                }}
                checked={checkedList.includes(row?.id)}
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

  // Columns for approved table
  const approvedColumns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => {
        const selectionNumber = getApprovedSelectionOrder(row?.preview_sale?.id);
        return (
          <span className="d-flex w-100">
            <span className="w-25">
              <input
                type="checkbox"
                className="w-100"
                onChange={(e) => {
                  handleApprovedSequentialSelection(row?.preview_sale?.id, e.target.checked);
                }}
                checked={checkedApprovedList.includes(row?.preview_sale?.id)}
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
                              ? "مبيعة جزئياً"
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
    {
      name: "حالة المعاينة",
      selector: (row) => [row?.preview_sale?.group_selling_status],
      cell: (row) => {
        const status = row?.preview_sale?.group_selling_status;
        let statusClass = "btn-light_";
        let statusText = status;
        
        switch (status) {
          case "APPROVED_TWICE":
            statusClass = "btn-success_";
            statusText = "معتمد مرتين";
            break;
          case "APPROVED_ONCE":
            statusClass = "btn-info_";
            statusText = "معتمد مرة واحدة";
            break;
          case "PENDING":
            statusClass = "btn-warning_";
            statusText = "في الانتظار";
            break;
          default:
            statusClass = "btn-light_";
            statusText = status;
        }
        
        return (
          <div className='d-flex my-auto' style={{ minWidth: "150px" }}>
            <span className={`${statusClass} my-auto`} style={{ fontSize: 12 }} >
              {statusText}
            </span>
          </div>
        )
      },
      sortable: true,
    },
  
  ];

  const approvedTableData = {
    columns: approvedColumns,
    data: approvedData,
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterModified, setIsFilterModified] = useState(false);
  
  const handleApply = () => {
    const start = dateRange[0].startDate.toLocaleDateString("en-CA");
    const end = dateRange[0].endDate.toLocaleDateString("en-CA");
    setStart(start)
    setEnd(end)
    setShowDatePicker(false);
    setIsFilterModified(true);
  };
  
  const resetFilter = () => {
    setDateRange([
      {
        startDate: new Date("2024-01-01"),
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        key: "selection",
      },
    ]);
    setStart("2024-01-01");
    setEnd(
      new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0]
    );
    setSelectedPackage('')
    setDays(120);
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
      <Seo title='طلبات متأخرة' />

      <PageHeader
        title='طلبات متأخرة'
        item='شركة وحيد'
        active_item='طلبات متأخرة'
      />

      <div>
        <Row className='row-sm' >
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10 '>
                <div
                  className='d-flex justify-content-between flex-wrap'
                  style={{ marginBottom: "-5px" }}
                >
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      طلبات متأخرة
                      <button disabled={loadingDelayedOrders} onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
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
                          onClick={handleGroupSelling}
                          variant="success"
                        >
                          {loading ? "جاري الارسال..." : "ارسال للمراجعة"}
                        </Button>
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
                
                <div className="d-flex align-items-end mt-4 gap-2">
                  <Form.Group className='text-start form-group mt-2' controlId='formDays'>
                    <Form.Label>عدد الأيام</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="365"
                      value={daysInput}
                      onChange={handleDaysChange}
                      onBlur={handleDaysBlur}
                      placeholder="120"
                      disabled={loadingDelayedOrders}
                    />
                  </Form.Group>

                  <Form.Group className='text-start form-group mt-2' controlId='formPackageFilter'>
                    <Form.Label> فرز عن طريق الباقة</Form.Label>
                    <Form.Select
                      disabled={loadingDelayedOrders || loadingPackages}
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
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={(page) => {
                      setPage(page)
                    }}
                    paginationPerPage={perPage}
                    onChangeRowsPerPage={(newPerPage, page) => {
                      setPerPage(newPerPage);
                      setPage(page);
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={loadingDelayedOrders || !urlInitRef.current}
                    progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Second Table - Approved Sales */}
        <Row className='row-sm mt-0'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10 '>
                <div
                  className='d-flex justify-content-between flex-wrap'
                  style={{ marginBottom: "-5px" }}
                >
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      المبيعات المعتمدة
                      <button disabled={loadingApproved} onClick={() => getApprovedSales()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>
                      </button>
                    </label>
                  </div>
                  <div className="dd-flex flex-wrap gap-2">
                    <div>
                      <div className='d-flex gap-3 align-items-center'>
                        <h5 className='font-weight-bold'>
                          {checkedApprovedList?.length < 1
                            ? "يجب تحديد الطلبات"
                            : ` عدد الطلبات (${checkedApprovedList?.length})`}
                        </h5>
                        <Button
                          disabled={
                            loading ||
                            checkedApprovedList?.length < 1
                              ? true
                              : false
                          }
                          onClick={() => handleApprovedAction('sell')}
                          variant="success"
                          className="d-flex align-items-center gap-1"
                        >
                          <Check fontSize="small" />
                          {loading ? "جاري البيع..." : "بيع "}
                        </Button>
                      
                        {checkedApprovedList?.length > 0 && (
                          <button
                            onClick={() => {
                              setCheckedApprovedList([]);
                              setApprovedSelectionOrder([]);
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
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="pos-relative">
                <DataTableExtensions {...approvedTableData}>
                  <DataTable
                    columns={approvedColumns}
                    defaultSortAsc={false}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRowsApproved}
                    onChangePage={(page) => {
                      setPageApproved(page)
                    }}
                    paginationPerPage={perPageApproved}
                    onChangeRowsPerPage={(newPerPage, page) => {
                      setPerPageApproved(newPerPage);
                      setPageApproved(page);
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={loadingApproved || !urlInitRef.current}
                    progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
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

DelayedOrders.layout = "Contentlayout";

export default DelayedOrders;
