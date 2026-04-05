import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const PurchaseFeedback = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generalRating, setGeneralRating] = useState("");
  const [receivedDues, setReceivedDues] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);

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
    const qGeneralRating = params.get('general_rating');
    const qReceivedDues = params.get('received_dues');
    const qStatus = params.get('status');
    
    let paramsChanged = false;
    
    if (qSearch && qSearch !== search) {
      setSearch(qSearch);
      setDebouncedSearch(qSearch);
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
    if (qGeneralRating && qGeneralRating !== generalRating) {
      setGeneralRating(qGeneralRating);
      paramsChanged = true;
    }
    if (qReceivedDues && qReceivedDues !== receivedDues) {
      setReceivedDues(qReceivedDues);
      paramsChanged = true;
    }
    if (qStatus && qStatus !== status) {
      setStatus(qStatus);
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
  }, [page, perPage, startDate, endDate, generalRating, receivedDues, status, debouncedSearch]);

  // Data fetching effect
  useEffect(() => {
    if (!urlInitRef.current) return;
    
    const abortController = new AbortController();
    const seq = (requestSeqRef.current += 1);
    const currentSeq = seq;
    
    setIsLoading(true);
    let url = `${baseUrl}/api/v1/purchase-feedback/?page=${page}&page_size=${perPage}`;
    
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (generalRating) params.append('general_rating', generalRating);
    if (receivedDues) params.append('received_dues', receivedDues);
    if (status) params.append('status', status);
    
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
        
        if (data && data.success && data.data) {
          setData(data.data.results || []);
          setTotalRows(data.data.count || 0);
          setSummary(data.data.summary || null);
        } else {
          setData([]);
          setTotalRows(0);
          setSummary(null);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error("Error fetching purchase feedback:", error);
        if (currentSeq === requestSeqRef.current) {
          setData([]);
          setTotalRows(0);
          setSummary(null);
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [page, perPage, startDate, endDate, generalRating, receivedDues, status, debouncedSearch, update, token]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    
    const nextQuery = {};
    if (debouncedSearch) nextQuery.search = debouncedSearch;
    if (startDate) nextQuery.start_date = startDate;
    if (endDate) nextQuery.end_date = endDate;
    if (generalRating) nextQuery.general_rating = generalRating;
    if (receivedDues) nextQuery.received_dues = receivedDues;
    if (status) nextQuery.status = status;
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, startDate, endDate, generalRating, receivedDues, status, page, perPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning">قيد الانتظار</span>;
      case "SUBMITTED":
        return <span className="badge bg-success">تم الإرسال</span>;
      case "EXPIRED":
        return <span className="badge bg-danger">منتهي الصلاحية</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getRatingStars = (rating) => {
    if (!rating) return "غير محدد";
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  const truncateText = (text, maxWords = 2) => {
    if (!text || text === "-") return "-";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const handleViewDetails = (row) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
      width: "70px",
    },
    {
      name: " عملية الشراء",
      selector: (row) => row.purchase_id,
      sortable: true,
      cell: (row) => {
        const purchaseId = row.purchase_id;
        const handleClick = (e) => {
          e.preventDefault();
          if (purchaseId) {
            // Use Next.js router for client navigation
            if (typeof window !== "undefined") {
              const router = require("next/router").default;
              router.push(`/dashboard/pages/purchases/${purchaseId}/`);
            }
          }
        };
        return purchaseId ? (
          <a
            href={`/dashboard/pages/purchases/${purchaseId}/`}
            onClick={handleClick}
            style={{ color: "#007bff", textDecoration: "none", cursor: "pointer" }}
          >
            {purchaseId}
          </a>
        ) : (
          "غير محدد"
        );
      },
      width: "150px",
    },
    {
      name: "التقييم العام",
      selector: (row) => row.general_rating,
      sortable: true,
      cell: (row) => (
        <div>
          {row.general_rating ? (
            <span>{getRatingStars(row.general_rating)} </span>
          ) : (
            "غير محدد"
          )}
        </div>
      ),
      width: "130px",
    },
    {
      name: "استلم المستحقات",
      selector: (row) => row.received_dues,
      sortable: true,
      cell: (row) => (
        <div>
          {row.received_dues === true ? (
            <span className="badge bg-success">نعم</span>
          ) : row.received_dues === false ? (
            <span className="badge bg-danger">لا</span>
          ) : (
            "غير محدد"
          )}
        </div>
      ),
      width: "140px",
    },
    {
      name: "الحالة",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: "جودة الخدمة",
      selector: (row) => row.service_quality,
      cell: (row) => (
        <div style={{ maxWidth: "200px", wordBreak: "break-word" }}>
          {truncateText(row.service_quality)}
        </div>
      ),
    },
    {
      name: "الأكثر إعجاباً",
      selector: (row) => row.most_liked,
      cell: (row) => (
        <div style={{ maxWidth: "200px", wordBreak: "break-word" }}>
          {truncateText(row.most_liked)}
        </div>
      ),
    },
    {
      name: "الاقتراحات",
      selector: (row) => row.suggestions,
      cell: (row) => (
        <div style={{ maxWidth: "200px", wordBreak: "break-word" }}>
          {truncateText(row.suggestions)}
        </div>
      ),
    },

    {
      name: "تاريخ الإنشاء",
      selector: (row) => row.created_at,
      sortable: true,
      cell: (row) => (
        <div dir='ltr'>
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-EG') : "غير محدد"}
        </div>
      ),
    },
    {
      name: "تاريخ الإرسال",
      selector: (row) => row.submitted_at,
      sortable: true,
      cell: (row) => (
        <div dir='ltr'>
          {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-EG') : "-"}
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
                onClick={() => handleViewDetails(row)}
              >
                <i className='ti ti-eye'></i>
              </Button>
            </OverlayTrigger>
          </div>
        ),
      },
  ];

  const tableData = {
    columns,
    data,
  };

  return (
    <>
      <Seo title='تعليقات الشراء' />

      <PageHeader
        title='تعليقات الشراء'
        item='شركة وحيد'
        active_item='تعليقات الشراء'
      />

      <div>
        {/* Summary Cards */}
        {summary && (
          <Row className='row-sm mb-4'>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>اجمالي روابط التقييم المرسلة</h6>
                      <h3 className='mb-0'>{summary.total_feedback_messages || 0}</h3>
                    </div>
                    <div className='icon-size text-primary'>
                      <i className='ti ti-message-circle'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>قيد الانتظار</h6>
                      <h3 className='mb-0 text-warning'>{summary.pending_count || 0}</h3>
                    </div>
                    <div className='icon-size text-warning'>
                      <i className='ti ti-clock'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>تم الإرسال</h6>
                      <h3 className='mb-0 text-success'>{summary.submitted_count || 0}</h3>
                    </div>
                    <div className='icon-size text-success'>
                      <i className='ti ti-check'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>منتهي الصلاحية</h6>
                      <h3 className='mb-0 text-danger'>{summary.expired_count || 0}</h3>
                    </div>
                    <div className='icon-size text-danger'>
                      <i className='ti ti-x'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Rating Statistics Cards */}
        {summary && summary.rating_statistics && (
          <Row className='row-sm mb-4'>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>متوسط التقييم</h6>
                      <h3 className='mb-0'>
                        {summary.rating_statistics.average_rating 
                          ? summary.rating_statistics.average_rating.toFixed(2) 
                          : "0.00"}
                      </h3>
                    </div>
                    <div className='icon-size text-primary'>
                      <i className='ti ti-star'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>أعلى تقييم</h6>
                      <h3 className='mb-0 text-success'>{summary.rating_statistics.highest_rating || 0}</h3>
                    </div>
                    <div className='icon-size text-success'>
                      <i className='ti ti-arrow-up'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>أقل تقييم</h6>
                      <h3 className='mb-0 text-danger'>{summary.rating_statistics.lowest_rating || 0}</h3>
                    </div>
                    <div className='icon-size text-danger'>
                      <i className='ti ti-arrow-down'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className='custom-card'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-grow-1'>
                      <h6 className='text-muted mb-1'>اجمالي التقييمات المستلمة </h6>
                      <h3 className='mb-0'>{summary.rating_statistics.total_with_ratings || 0}</h3>
                    </div>
                    <div className='icon-size text-primary'>
                      <i className='ti ti-chart-bar'></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Main Table */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className='custom-card'>
              <Card.Header className='border-bottom-0'>
                <div style={{ marginBottom: "5px" }}>
                  <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                    <label className='main-content-label my-auto'>
                      تعليقات الشراء
                      <button
                        disabled={isLoading}
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

                    <div className="d-flex gap-2 flex-wrap align-items-end">
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>البحث</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="البحث..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{ width: "200px" }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>تاريخ البداية</Form.Label>
                        <Form.Control
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{ width: "150px" }}
                          disabled={isLoading}
                        />
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>تاريخ النهاية</Form.Label>
                        <Form.Control
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{ width: "150px" }}
                          disabled={isLoading}
                        />
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>التقييم العام</Form.Label>
                        <Form.Select
                          value={generalRating}
                          onChange={(e) => setGeneralRating(e.target.value)}
                          style={{ width: "180px" , paddingRight: "30px"}}
                          disabled={isLoading}
                        >
                          <option value="">جميع التقييمات</option>
                          <option value="1">⭐ 1</option>
                          <option value="2">⭐⭐ 2</option>
                          <option value="3">⭐⭐⭐ 3</option>
                          <option value="4">⭐⭐⭐⭐ 4</option>
                          <option value="5">⭐⭐⭐⭐⭐ 5</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>استلم المستحقات</Form.Label>
                        <Form.Select
                          value={receivedDues}
                          onChange={(e) => setReceivedDues(e.target.value)}
                          style={{ width: "180px" , paddingRight: "30px"}}
                          disabled={isLoading}
                        >
                          <option value="">جميع الحالات</option>
                          <option value="true">استلم المستحقات</option>
                          <option value="false">لم يستلم</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-0">
                        <Form.Label className="mb-1" style={{ fontSize: "0.875rem" }}>الحالة</Form.Label>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          style={{ width: "180px" , paddingRight: "30px"}}
                          disabled={isLoading}
                        >
                          <option value="">جميع الحالات</option>
                          <option value="PENDING">قيد الانتظار</option>
                          <option value="SUBMITTED">تم الإرسال</option>
                          <option value="EXPIRED">منتهي الصلاحية</option>
                        </Form.Select>
                      </Form.Group>
                      {(search || startDate || endDate || generalRating || receivedDues || status) && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setDebouncedSearch("");
                            setStartDate("");
                            setEndDate("");
                            setGeneralRating("");
                            setReceivedDues("");
                            setStatus("");
                            setPage(1);
                          }}
                          disabled={isLoading}
                          style={{ marginBottom: "0" }}
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
                    progressPending={isLoading || !urlInitRef.current}
                    progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
                    noDataComponent="لا توجد تعليقات شراء"
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل  التقييم</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">ID</div>
                    <div className="text-dark">{selectedRow.id}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">رقم العملية</div>
                    <div className="text-dark">{selectedRow.purchase_id || "غير محدد"}</div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">التقييم العام</div>
                    <div className="text-dark">
                      {selectedRow.general_rating ? (
                        <span>{getRatingStars(selectedRow.general_rating)} ({selectedRow.general_rating})</span>
                      ) : (
                        "غير محدد"
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">استلم المستحقات</div>
                    <div className="text-dark">
                      {selectedRow.received_dues === true ? (
                        <span className="badge bg-success">نعم</span>
                      ) : selectedRow.received_dues === false ? (
                        <span className="badge bg-danger">لا</span>
                      ) : (
                        "غير محدد"
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">الحالة</div>
                    <div className="text-dark">{getStatusBadge(selectedRow.status)}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">الوضوح</div>
                    <div className="text-dark">
                      {selectedRow.clarity === true ? (
                        <span className="badge bg-success">نعم</span>
                      ) : selectedRow.clarity === false ? (
                        <span className="badge bg-danger">لا</span>
                      ) : (
                        "غير محدد"
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="border rounded p-3 mb-3">
                <div className="fw-bold text-primary mb-1">جودة الخدمة</div>
                <div className="text-dark">{selectedRow.service_quality || "-"}</div>
              </div>

              <div className="border rounded p-3 mb-3">
                <div className="fw-bold text-primary mb-1">الأكثر إعجاباً</div>
                <div className="text-dark">{selectedRow.most_liked || "-"}</div>
              </div>

              <div className="border rounded p-3 mb-3">
                <div className="fw-bold text-primary mb-1">الاقتراحات</div>
                <div className="text-dark">{selectedRow.suggestions || "-"}</div>
              </div>

              {selectedRow.notes && (
                <div className="border rounded p-3 mb-3">
                  <div className="fw-bold text-primary mb-1">ملاحظات</div>
                  <div className="text-dark">{selectedRow.notes}</div>
                </div>
              )}

              {selectedRow.additional_comments && (
                <div className="border rounded p-3 mb-3">
                  <div className="fw-bold text-primary mb-1">تعليقات إضافية</div>
                  <div className="text-dark">{selectedRow.additional_comments}</div>
                </div>
              )}

              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">تاريخ الإنشاء</div>
                    <div className="text-dark" dir="ltr">
                      {selectedRow.created_at ? new Date(selectedRow.created_at).toLocaleDateString('en-EG') : "غير محدد"}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">تاريخ الإرسال</div>
                    <div className="text-dark" dir="ltr">
                      {selectedRow.submitted_at ? new Date(selectedRow.submitted_at).toLocaleDateString('en-EG') : "-"}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">تاريخ التحديث</div>
                    <div className="text-dark" dir="ltr">
                      {selectedRow.updated_at ? new Date(selectedRow.updated_at).toLocaleDateString('en-EG') : "-"}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">تاريخ انتهاء الصلاحية</div>
                    <div className="text-dark" dir="ltr">
                      {selectedRow.expires_at ? new Date(selectedRow.expires_at).toLocaleDateString('en-EG') : "-"}
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">منتهي الصلاحية</div>
                    <div className="text-dark">
                      {selectedRow.is_expired ? (
                        <span className="badge bg-danger">نعم</span>
                      ) : (
                        <span className="badge bg-success">لا</span>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 mb-3">
                    <div className="fw-bold text-primary mb-1">صالح</div>
                    <div className="text-dark">
                      {selectedRow.is_valid ? (
                        <span className="badge bg-success">نعم</span>
                      ) : (
                        <span className="badge bg-danger">لا</span>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

          
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

PurchaseFeedback.layout = "Contentlayout";

export default PurchaseFeedback;

