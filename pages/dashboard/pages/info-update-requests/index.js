import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, OverlayTrigger, Row, Tooltip, Button, Modal, Form, Dropdown } from "react-bootstrap";
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
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const ViewRequestModal = ({
  show,
  handleClose,
  requestData,
}) => {
  const getFieldLabel = (fieldKey) => {
    const fieldLabels = {
      'dob': 'تاريخ الميلاد',
      'iban': 'رقم الآيبان',
      'name': 'الاسم',
      'email': 'البريد الإلكتروني',
      'city_id': 'المدينة',
      'city': 'المدينة',
      'bank_name': 'اسم البنك',
      'region_id': 'المنطقة',
      'region': 'المنطقة',
      'national_id': 'رقم الهوية',
      'nationality_id': 'الجنسية',
      'nationality': 'الجنسية'
    };
    return fieldLabels[fieldKey] || fieldKey;
  };

  const formatFieldValue = (key, value, requestData) => {
    if (!value || value === '') return 'غير محدد';
    
    // Handle date fields
    if (key === 'dob' && value) {
      try {
        return new Date(value).toLocaleDateString('ar-SA');
      } catch {
        return value;
      }
    }
    
    // Handle city object - show city name if available
    if (key === 'city' && typeof value === 'object' && value?.nameAr) {
      return value.nameAr;
    }
    
    // Handle region object - show region name if available
    if (key === 'region' && typeof value === 'object' && value?.name) {
      return value.name;
    }
    
    // Handle nationality object - show nationality name if available
    if (key === 'nationality' && typeof value === 'object' && value?.name_ar) {
      return value.name_ar;
    }
    
    // Handle city_id - show city name if available (fallback for old structure)
    if (key === 'city_id' && requestData?.city?.nameAr) {
      return requestData.city.nameAr;
    }
    
    // Handle region_id - show region name if available (fallback for old structure)
    if (key === 'region_id' && requestData?.region?.name) {
      return requestData.region.name;
    }
    
    // Handle nationality_id - show nationality name if available (fallback for old structure)
    if (key === 'nationality_id' && requestData?.nationality?.name_ar) {
      return requestData.nationality.name_ar;
    }
    
    return value;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>تفاصيل طلب تحديث المعلومات</Modal.Title>
      </Modal.Header>
      <Modal.Body>
    
       

        <div>
          <h6 className="text-primary mb-3">البيانات المطلوب تحديثها</h6>
          <div className="row">
            {requestData?.requested_fields && Object.entries(requestData.requested_fields).map(([key, value]) => (
              <div key={key} className="col-md-6 mb-3">
                <div className="border rounded p-3">
                  <div className="fw-bold text-primary mb-1">
                    {getFieldLabel(key)}
                  </div>
                  <div className="text-dark">
                    {formatFieldValue(key, value, requestData)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const UpdateStatusModal = ({
  show,
  handleClose,
  requestData,
  forceUpdate,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("APPROVED");
  const [rejectionReason, setRejectionReason] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestBody = {
        status: status,
      };

      if (status === "REJECTED" && rejectionReason.trim()) {
        requestBody.rejection_reason = rejectionReason;
      }

      const res = await fetch(
        `${baseUrl}/api/v1/info-update-requests/${requestData?.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (res.status === 401) {
        logout();
        return;
      }

      const result = await res.json();

      if (res.status === 200 || res.ok) {
        toast.success("تم تحديث حالة الطلب بنجاح");
        forceUpdate();
        handleClose();
        setStatus("APPROVED");
        setRejectionReason("");
      } else {
        toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>تحديث حالة طلب تحديث المعلومات</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>الحالة</Form.Label>
            <Form.Select
              value={status}
              className="form-control ps-5"
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="APPROVED">موافق</option>
              <option value="REJECTED">مرفوض</option>
            </Form.Select>
          </Form.Group>

          {status === "REJECTED" && (
            <Form.Group className="mb-3">
              <Form.Label>سبب الرفض</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="أدخل سبب الرفض"
                maxLength={72}
                required
              />
              <Form.Text className="text-muted">
                {rejectionReason.length}/72 حرف
              </Form.Text>
            </Form.Group>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "جاري التحديث..." : "تحديث الحالة"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const Orders = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalRows, setTotalRows] = useState(0);
  const urlInitRef = useRef(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"));
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'طلبات تحديث المعلومات'
      );

      const canUpdate = componentPermissions?.some((permission) => permission.display_name === "تحديث الحالة");
      setIsCanUpdate(canUpdate);
    }
  }, [user]);

  // Fetch customers for dropdown and initialize URL parameters
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`${baseUrl}/api/v1/get_customer/?page_size=1000`, {
          headers: { Authorization: `${token}` },
        });

        if (res.status === 401) {
          logout();
          return;
        }

        const result = await res.json();
        if (result && result.results) {
          setCustomers(result.results);
          
          // After customers are loaded, check if we need to initialize from URL
          if (typeof window !== 'undefined' && !urlInitRef.current) {
            const params = new URLSearchParams(window.location.search);
            const qCustomer = params.get('customer');
            const qStatus = params.get('status');
            const qPage = params.get('page');
            const qPageSize = params.get('page_size');
            
            let paramsChanged = false;
            
            if (qCustomer) {
              setCustomerFilter(qCustomer);
              paramsChanged = true;
              // Find and set the customer name for the filter input
              const selectedCustomer = result.results.find(c => c.id?.toString() === qCustomer);
              if (selectedCustomer) {
                setCustomerSearch(selectedCustomer.name);
              }
            }
            if (qStatus) {
              setStatusFilter(qStatus);
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
            
            // Only after all parameters are set, mark URL as initialized
            urlInitRef.current = true;
            
            // If any params were changed, no need to force update as the dependency array will trigger the fetch
            // Only force update if no params were changed to ensure we fetch at least once
            if (!paramsChanged) {
              forceUpdate();
            }
          }
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [token]);

  // When customers are loaded and a customerFilter (id) exists (e.g., from URL), show its name in the input
  useEffect(() => {
    if (customerFilter && customers && customers.length > 0) {
      const selected = customers.find((c) => c.id?.toString() === customerFilter);
      if (selected && customerSearch !== selected.name) {
        setCustomerSearch(selected.name);
      }
    }
  }, [customers, customerFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomerDropdown && !event.target.closest('.position-relative')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setIsLoading(true);
      let url = `${baseUrl}/api/v1/info-update-requests/`;
      const params = new URLSearchParams();

      if (customerFilter) {
        params.append('customer', customerFilter);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (page) {
        params.append('page', String(page));
      }
      if (perPage) {
        params.append('page_size', String(perPage));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      fetch(url, {
        headers: { Authorization: `${token}` },
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
            if (typeof data.count === 'number') {
              setTotalRows(data.count);
            } else {
              setTotalRows(data.results.length || 0);
            }
          } else if (data && Array.isArray(data)) {
            setData(data);
            setTotalRows(data.length || 0);
          } else {
            setData([]);
            setTotalRows(0);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setData([]);
          setTotalRows(0);
          setIsLoading(false);
        });
    }
  }, [customerFilter, statusFilter, page, perPage, update]);

  // Initialize filters/pagination from URL on mount is now handled in the fetchCustomers effect

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    const nextQuery = {};
    if (customerFilter) nextQuery.customer = customerFilter;
    if (statusFilter) nextQuery.status = statusFilter;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 20) nextQuery.page_size = String(perPage);
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [customerFilter, statusFilter, page, perPage]);
  

  // Get selected customer name
  const getSelectedCustomerName = () => {
    if (!customerFilter) return "جميع العملاء";
    const selectedCustomer = customers.find(c => c.id.toString() === customerFilter);
    return selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.id}` : "جميع العملاء";
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer?.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer?.id?.toString().includes(customerSearch)
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning">في الانتظار</span>;
      case "APPROVED":
        return <span className="badge bg-success">موافق</span>;
      case "REJECTED":
        return <span className="badge bg-danger">مرفوض</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },
    {
      name: "اسم العميل",
      selector: (row) => row.customer?.name || "",
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>
          {row.customer?.name || "غير محدد"}
        </div>
      ),
    },
    {
      name: "رقم العميل",
      selector: (row) => row.customer?.id || "",
      sortable: true,
      cell: (row) => <div>{row.customer?.id || "غير محدد"}</div>,
    },


    {
      name: "الحالة",
      selector: (row) => row.status || "",
      sortable: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: "تاريخ الطلب",
      selector: (row) => row.created_at || "",
      sortable: true,
      cell: (row) => (
        <div dir='ltr'>
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-EG') : "غير محدد"}
        </div>
      ),
    },
    {
      name: "سبب الرفض",
      selector: (row) => row.rejection_reason || "",
      sortable: false,
      cell: (row) => (
        <div style={{ maxWidth: "150px", wordBreak: "break-word" }}>
          {row.rejection_reason || "-"}
        </div>
      ),
    },
    {
      name: "الإجراءات",
      selector: (row) => row.ACTIONS,
      cell: (row) => (
        <div className='button-list d-flex gap-2'>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
          >
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setSelectedRequest(row);
                setShowViewModal(true);
              }}
            >
              <i className='ti ti-eye'></i>
            </Button>
          </OverlayTrigger>
          {(user_type === "ADM" || isCanUpdate) && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>تحديث الحالة</Tooltip>}
            >
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setSelectedRequest(row);
                  setShowUpdateModal(true);
                }}
                // disabled={row.status === "APPROVED" || row.status === "REJECTED"}
              >
                <i className='ti ti-pencil'></i>
              </Button>
            </OverlayTrigger>
          )}
        </div>
      ),
    },
  ].filter(Boolean);

  const tableData = {
    columns,
    data,
  };

  return (
    <>
      <Seo title='طلبات تحديث المعلومات' />

      <PageHeader
        title='طلبات تحديث المعلومات'
        item='شركة وحيد'
        active_item='طلبات تحديث المعلومات'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "5px" }}>
                  <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                    <label className='main-content-label my-auto'>
                      طلبات تحديث المعلومات
                      <button
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

                      {/* <Form.Select
                         value={statusFilter}
                         onChange={(e) => setStatusFilter(e.target.value)}
                         style={{ width: "150px" }}
                       >
                         <option value="">جميع الحالات</option>
                         <option value="PENDING">في الانتظار</option>
                         <option value="APPROVED">موافق</option>
                         <option value="REJECTED">مرفوض</option>
                       </Form.Select> */}
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="position-relative  " style={{ width: "250px" }}>
                  <Form.Control
                    type="text"
                    
                    placeholder="البحث عن عميل..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    style={{ width: "100%" }}
                    disabled={loadingCustomers}
                  />
                  {showCustomerDropdown && (
                    <div
                      className="position-absolute w-100 bg-white border rounded shadow-sm"
                      style={{
                        top: "100%",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}
                    >
                      <div
                        className="p-2 border-bottom cursor-pointer"
                        onClick={() => {
                          setCustomerFilter("");
                          setCustomerSearch("");
                          setShowCustomerDropdown(false);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <strong>جميع العملاء</strong>
                      </div>
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-2 border-bottom cursor-pointer"
                          onClick={() => {
                            setCustomerFilter(customer.id.toString());
                            setCustomerSearch(customer.name);
                            setShowCustomerDropdown(false);
                          }}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                        >
                          <div className="font-weight-bold">{customer.name}</div>
                          <small className="text-muted">ID: {customer.id}</small>
                        </div>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="p-2 text-muted">
                          لا توجد نتائج
                        </div>
                      )}
                    </div>
                  )}
                  {customerFilter && (
                    <div className="position-absolute" style={{ top: "50%", left: "10px", transform: "translateY(-50%)" }}>
                      <Button
                        variant="link"
                        size="l"
                        className="p-0 text-danger"
                        onClick={() => {
                          setCustomerFilter("");
                          setCustomerSearch("");
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
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
                    paginationRowsPerPageOptions={[10, 20, 50, 100]}
                    noDataComponent="لا توجد طلبات تحديث معلومات"
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

      {showViewModal && (
        <ViewRequestModal
          show={showViewModal}
          handleClose={() => {
            setShowViewModal(false);
            setSelectedRequest(null);
          }}
          requestData={selectedRequest}
        />
      )}

      {showUpdateModal && (
        <UpdateStatusModal
          show={showUpdateModal}
          handleClose={() => {
            setShowUpdateModal(false);
            setSelectedRequest(null);
          }}
          requestData={selectedRequest}
          forceUpdate={forceUpdate}
          token={token}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
