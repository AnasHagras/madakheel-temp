"use client";
import React, { useEffect, useReducer, useState, useRef } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
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
// images
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import Link from "next/link";
import { useRouter } from "next/router";
import * as XLSX from 'xlsx';
const RejectPopup = ({ setRejectPopup, loading, rejectWallet }) => {
  const [reason, setReason] = useState("");
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من رفض الطلب </h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <Form onSubmit={(e) => rejectWallet(e, reason)}>
            <Form.Group className='text-start form-group'>
              <Form.Label>السبب</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل سبب الرفض'
                name='reason'
                type='text'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                required
              />
            </Form.Group>
            <div className='d-flex justify-content-center gap-5'>
              <button
                className='btn btn-lg btn-danger px-5 '
                disabled={loading}
                style={{ minWidth: "fit-content" }}
                type='submit'
              >
                {loading ? "جاري التحميل ..." : "رفض"}
              </button>
              <button
                className='btn btn-lg btn-outline-dark px-5'
                type='button'
                onClick={() => setRejectPopup(false)}
              >
                إلغاء
              </button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

const ActivatePopup = ({
  setActivatePopup,
  walletData,
  loading,
  confirmWallet,
  bulkMode = false,
  selectedRows = [],
  confirmWalletBulk,
}) => {
  const [sendMessage, setSendMessage] = useState(true); // Default to true

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>
            {bulkMode 
              ? `هل تريد تسجيل تحويل كامل المستحقات لـ ${selectedRows.length} محفظة؟`
              : "هل تريد تسجيل تحويل كامل المستحقات للعميل؟"
            }
          </h4>
          <img src={active.src} alt='stop' width={80} className='my-4' />
          
          {/* Add checkbox for sending message */}
          <div className="form-check mb-4 " style={{fontSize:'20px'}}>
          <label className="form-check-label me-2" htmlFor="sendMessageCheckbox">
              هل تريد ارسال رسالة للعميل؟
            </label>
            <input
              className="form-check-input ms-0"
              type="checkbox"
              checked={sendMessage}
              onChange={(e) => setSendMessage(e.target.checked)}
              id="sendMessageCheckbox"
            />
          
          </div>

          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-primary px-5 '
              onClick={() => {
                if (bulkMode) {
                  confirmWalletBulk(selectedRows, sendMessage);
                } else {
                  confirmWallet(walletData?.id, walletData?.customer?.id, sendMessage);
                }
              }}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التحويل ..." : "قبول"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setActivatePopup(false)}
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
  const [loading, setLoading] = useState(false);

  const [activatePopup, setActivatePopup] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [rejectPopup, setRejectPopup] = useState(false);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token, id: adminId, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);  
  const [perPage, setPerPage] = useState(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const urlInitRef = useRef(false);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (user_type === "ACC") {
      const permissions =  JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'المحافظ'
      );

      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');


      setIsCanUpdate(canUpdate);
    }
  }, [user]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  const [isLoading, setIsLoading] = useState(false);
  // Track that we have read URL params and applied state updates,
  // but delay enabling API fetches until after those state updates commit
  const didInitFromUrlRef = useRef(false);
  
  // Fetch data effect
  useEffect(() => {
    // Only execute API calls if URL initialization is complete
    if (urlInitRef.current) {
      setIsLoading(true);
      let url = `${baseUrl}/api/v1/get_wallet_list/?page=${page}&page_size=${perPage}`;
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      
      fetch(url, {
        headers: {
          Authorization: token,
        },
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
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching wallets:", error);
          setData([]);
          setTotalRows(0);
          setIsLoading(false);
        });
    }
  }, [update, page, perPage, debouncedSearch]);

  // Debounce search input (smooth typing)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Initialize from URL on first load (do not enable fetching yet)
  useEffect(() => {
    if (typeof window === 'undefined' || urlInitRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    const qSearch = params.get('search');

    // Only apply URL params if they exist and differ from current state
    if (qPage && !Number.isNaN(Number(qPage))) {
      const nextPage = Number(qPage);
      console.log(nextPage);
      if (nextPage !== page) setPage(nextPage);
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize))) {
      const nextPerPage = Number(qPageSize);
      if (nextPerPage !== perPage) setPerPage(nextPerPage);
    }
    if (typeof qSearch === 'string' && qSearch.length > 0) {
      if (qSearch !== search) {
        setSearch(qSearch);
        setDebouncedSearch(qSearch);
      }
    }

    // We've applied URL params to state; a subsequent effect will enable fetching
    didInitFromUrlRef.current = true;
  }, []);

  // After URL params have been applied to state, enable fetching exactly once
  useEffect(() => {
    if (!urlInitRef.current && didInitFromUrlRef.current) {
      urlInitRef.current = true;
      // Trigger fetch with the now-correct state (page/perPage/search)
      forceUpdate();
    }
  }, [page, perPage, debouncedSearch]);
  

  // Sync URL without navigation (always keep page/page_size)
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

  // Reset selection when data changes (e.g. page change, search)
  useEffect(() => {
    setSelectAll(false);
    setSelectedRows([]);
  }, [data]);

  console.log(data);
  const router = useRouter();
  const confirmWallet = async (id, customer_id, send_message = true) => {
    const fd = new FormData();
    fd.append("admin", adminId);
    fd.append("status", "pending");
    fd.append("customer_id", customer_id);
    fd.append("send_message", send_message); // Add the send_message parameter

    setLoading(true);

    const res = await fetch(`${baseUrl}/api/v1/wallet/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: token,
      },
      body: fd,
    });
    
    if (res.status == 401) {
      logout();
    }
    
    const result = await res.json();
    if (res.status === 200 && result.success) {
      toast.success("تم تسجيل التحويل بنجاح");
      forceUpdate();
      setActivatePopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }
    setLoading(false);
  };
  const confirmWalletBulk = async (rows, send_message = true) => {
    if (!rows || rows.length === 0) {
      toast.error("قم باختيار المحافظ اولا");
      return;
    }
    setLoading(true);
    try {
      // Extract wallet IDs from selected rows
      const wallet_ids = rows.map(row => row.id);

      const res = await fetch(`${baseUrl}/api/v1/wallet/batch_approve/`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_ids: wallet_ids,
          send_message: send_message,
        }),
      });

      if (res.status === 401) {
        logout();
        setLoading(false);
        return;
      }

      const result = await res.json();
      
      if (res.status === 200 && result.success) {
        const { totals, results } = result;
        
        // Show detailed message based on results
        if (totals.failed === 0) {
          toast.success(`تم تسجيل التحويل بنجاح لجميع المحافظ المحددة (${totals.succeeded}/${totals.total})`);
        } else if (totals.succeeded === 0) {
          toast.error(`فشل تسجيل التحويل لجميع المحافظ المحددة (${totals.failed}/${totals.total})`);
        } else {
          toast.warning(`تم تسجيل التحويل لـ ${totals.succeeded} محفظة وفشل ${totals.failed} محفظة من أصل ${totals.total}`);
        }

        // Show individual error messages if any failed
        if (results && results.length > 0) {
          const failedWallets = results.filter(r => !r.success);
          if (failedWallets.length > 0) {
            failedWallets.forEach(wallet => {
              toast.error(`المحفظة ${wallet.wallet_id}: ${wallet.message}`);
            });
          }
        }

        forceUpdate();
        setActivatePopup(false);
      } else {
        toast.error(result.message || "حدث خطأ ما");
      }
    } catch (error) {
      console.error("Error confirming wallets:", error);
      toast.error("حدث خطأ أثناء تسجيل التحويلات");
    } finally {
      setLoading(false);
    }
  };
  const goToPrint = () => {
    if (selectedRows.length > 0) {
      window.localStorage.setItem('selectedWallets', JSON.stringify(selectedRows))
      router.push("/dashboard/pages/wallets/report")

    }
    else {
      toast.error("قم باختيار المحافظ اولا");
    }
  };
  const handleCheckboxChange = (row) => {
    setSelectedRows((prevSelectedRows) => {
      if (prevSelectedRows.some((selectedRow) => selectedRow.id === row.id)) {
        const newSelectedRows = prevSelectedRows.filter((selectedRow) => selectedRow.id !== row.id);
        // If we're deselecting and selectAll is true, turn off selectAll
        if (selectAll) {
          setSelectAll(false);
        }
        return newSelectedRows;
      } else {
        const newSelectedRows = [...prevSelectedRows, row];
        return newSelectedRows;
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      // Select all visible rows in the table that have amount > 0
      const selectableRows = data.filter(row => row.amount?.toFixed(3) > 0);
      setSelectedRows(selectableRows);
      setSelectAll(true);
    }
  };


  const rejectWallet = async (e, reason) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("admin", adminId);
    fd.append("status", "rejected");
    fd.append("customer_id", walletData?.customer);
    fd.append("reason", reason);

    setLoading(true);

    const res = await fetch(
      `${baseUrl}/api/v1/wallet/${walletData?.id}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: token,
        },
        body: fd,
      },
    );
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    if (res.status === 200 && result.success) {
      toast.success("تم الرفض بنجاح");
      forceUpdate();
      setRejectPopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }
    setLoading(false);
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "اسم العميل",
      selector: (row) => [row.customer?.name],
      sortable: true,
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/users/${row.customer?.id}/`}
        >
          {row.customer?.name}
        </Link>

      ),
    },

    {
      name: "الجوال",
      selector: (row) => [row.customer?.mobile],
      cell: (row) => (
        <div className='font-weight-bold'>{row.customer?.mobile}</div>
      ),
      sortable: true,
    },
    {
      name: "المبلغ",
      selector: (row) => [row.amount.toFixed(2)],
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
          {(+row.amount).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
      ),
    },

    {
      name: "تسجيل تحويل",
      selector: (row) => [row.status],
      sortable: true,
      cell: (row) => (
        row.amount.toFixed(3) > 0 && (user_type === "ADM" || isCanUpdate ) ?
          <div
            className='button-list'
            onClick={() => {
              setWalletData(row);
              setBulkMode(false);
              if (row.status === "pending") setActivatePopup(true);
            }}
          >
            <OverlayTrigger
              placement={row.Placement}
              overlay={
                <Tooltip>
                  {row.status === "rejected"
                    ? "تم رفضه"
                    : row.status === "pending"
                      ? "قبول"
                      : row.status === "approved"
                        ? "تم قبوله"
                        : row.status}
                </Tooltip>
              }
            >
              <i
                className={`ti ti-${row.status === "approved" ? "check" : "check"
                  } btn`}
                style={
                  row.status === "pending"
                    ? { cursor: "pointer" }
                    : { cursor: "not-allowed" }
                }
              ></i>
            </OverlayTrigger>
          </div> : ''
      ),
    },
    {
      name: "تحديد",
      selector: (row) => row.id,
      cell: (row) => (
        row.amount.toFixed(3) > 0 ?
          <input
            type="checkbox"
            checked={selectedRows.some((selectedRow) => selectedRow.id === row.id)}
            onChange={() => handleCheckboxChange(row)}
          />
          : ''
      ),
      sortable: false,
    },
  ];

  const tableData = {
    columns,
    data,
    selectableRows: selectedRows,
  };
  return (
    <>
      <Seo title='المحافظ' />

      <PageHeader title='المحافظ' item='شركة وحيد' active_item='المحافظ' />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex'>
                    <label className='main-content-label my-auto '>
                      المستحقات في المحافظ
                      <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check d-flex justify-content-center align-items-center gap-2 fs-5">
                      <input
                       style={{width:'20px',height:'20px'}}
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        id="selectAllCheckbox"
                      />
                      <label className="form-check-label" htmlFor="selectAllCheckbox">
                        تحديد الكل
                      </label>
                    </div>
                    {selectedRows.length > 0 && (
                      <>
                        <span className="text-muted">
                          تم تحديد {selectedRows.length} محفظة
                        </span>
                        <Button
                          className="ms-3"
                          variant="primary"
                          onClick={() => {
                            setBulkMode(true);
                            setActivatePopup(true);
                          }}
                        >
                          قبول ({selectedRows.length})
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button onClick={() => goToPrint()}> طباعة التقرير</Button>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                  </div>
                </div>
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
                      if (newPage !== page) setPage(newPage);
                    }}
                    paginationPerPage={perPage}  
                    onChangeRowsPerPage={(newPerPage, nextPage) => {
                      const willChangePerPage = Number(newPerPage) !== Number(perPage);
                      const willChangePage = Number(nextPage) !== Number(page);
                      if (willChangePerPage) setPerPage(Number(newPerPage));
                      if (willChangePage) setPage(Number(nextPage));
                    }}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    progressPending={isLoading}
                    progressComponent={<div className="p-4 text-center">جاري التحميل...</div>}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
      {rejectPopup && (
        <RejectPopup
          loading={loading}
          setRejectPopup={setRejectPopup}
          rejectWallet={rejectWallet}
        />
      )}
      {/* {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteUser={deleteUser}
        />
      )} */}
      {activatePopup && (
        <ActivatePopup
          loading={loading}
          setActivatePopup={setActivatePopup}
          walletData={walletData}
          confirmWallet={confirmWallet}
          bulkMode={bulkMode}
          selectedRows={selectedRows}
          confirmWalletBulk={confirmWalletBulk}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
