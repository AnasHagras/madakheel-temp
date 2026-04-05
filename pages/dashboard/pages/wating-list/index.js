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
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();
const ConfirmPopup = ({ setConfirmPopup, data, loading, clearWaitingListSms }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4> هل تود إشعار العملاء بتوفر الباقة؟     </h4>
         
          <div className='d-flex justify-content-center gap-5 mt-4'>
            <button
              className='btn btn-lg btn-success px-5 '
              onClick={() => clearWaitingListSms(data)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الإرسال ..." : "إرسال"}
            </button>
            <button
              className='btn btn-lg btn-danger px-5'
              onClick={() => setConfirmPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
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
      newNumber = splitedNumber[0] + ".000";
    }
    return newNumber;
  } else if (type === "int") {
    return changedNumber;
  }
};

const Orders = () => {
  const { token, id, user_type } = user;
  const [data, setData] = useState([]);
  const [packages, setPackages] = useState([]);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [packData, setPackData] = useState();
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanSendNotification, setIsCanSendNotification] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);

  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);  
  const [perPage, setPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const urlInitRef = useRef(false);
  const didInitFromUrlRef = useRef(false);
  const requestSeqRef = useRef(0);
  
  useEffect(() => {
    if ( user_type === "ACC") {
    const permissions =  JSON.parse(localStorage.getItem("permissions"))
    const componentPermissions = permissions?.filter(
      (permission) => permission.group_name === 'قائمة الانتظار'
    );
    const canSendNotification = componentPermissions?.some((permission) => permission.display_name === 'تنبيه المستخدمين بتوفر الباقة');
    const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'حذف');

    setIsCanSendNotification(canSendNotification);
    setIsCanUpdate(canUpdate);
  }
  }, [user]);

  // Initialize URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (didInitFromUrlRef.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const qPage = params.get('page');
    const qPageSize = params.get('page_size');
    
    let paramsChanged = false;
    
    if (qPage && !Number.isNaN(Number(qPage)) && Number(qPage) !== page) {
      setPage(Number(qPage));
      paramsChanged = true;
    }
    if (qPageSize && !Number.isNaN(Number(qPageSize)) && Number(qPageSize) !== perPage) {
      setPerPage(Number(qPageSize));
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
  }, [page, perPage]);

  // Data fetching effect
  useEffect(() => {
    if (!urlInitRef.current) return;
    
    const abortController = new AbortController();
    const seq = (requestSeqRef.current += 1);
    const currentSeq = seq;
    
    setIsLoading(true);
    fetch(`${baseUrl}/api/v1/waiting_list/?page=${page}&page_size=${perPage}`, {
      headers: {
        Authorization: ` ${user?.token}`,
      },
      signal: abortController.signal,
    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        if (currentSeq !== requestSeqRef.current) return; // Ignore stale response
        
        data.results && setData(data.results?.waiting_lists);
        data.count && setTotalRows(data.count);
        data.results && setPackages(data.results?.grouped_waiting_lists);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (currentSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [update, page, perPage]);

  // Sync URL without navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!urlInitRef.current) return;
    
    const nextQuery = {};
    if (page && page !== 1) nextQuery.page = String(page);
    if (perPage && perPage !== 50) nextQuery.page_size = String(perPage);
    
    const nextParams = new URLSearchParams(nextQuery).toString();
    const currentParams = window.location.search.replace(/^\?/, '');
    if (currentParams === nextParams) return;
    
    const newUrl = nextParams ? `${window.location.pathname}?${nextParams}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, perPage]);

  const clearWaitingListSms = async (id) => {
    setLoading(true)
    const res = await fetch(`${baseUrl}/api/v1/waiting_list_sms/` ,{
      method:"POST",
      body: JSON.stringify({
        package_id:id
      }),
      headers: {
       "Accept": "application/json",
        "Content-Type": "application/json",
        Authorization: ` ${user?.token}`,
      },
    });
    if(res.status == 401){
      logout()
    }
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      toast.info(result[0]);
      setLoading(false)
      setConfirmPopup(false)
      forceUpdate();
    }
  };

  const filterdPackages = Array.from(
    new Set(data?.map((item) => item?.package?.id)),
  );

  const getCardData = (packageId) => {
    let totalQuantity = 0;
    let totalPrice = 0;
    const filteredData = packages?.filter(
      (item) => item?.package?.id == packageId,
    );
    filteredData?.forEach(
      (item) => (totalQuantity += item?.total_waiting_quantity),
    );
    filteredData?.forEach((item) => (totalPrice += item?.package?.price * item?.total_waiting_quantity));
    return {
      quantity: changeNumberFormate(totalQuantity, "int"),
      price: changeNumberFormate(totalPrice, "float"),
      title: filteredData[0]?.package?.title,
    };
  };

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "الاسم",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.user?.name}</div>,
    },

    {
      name: "الباقة",
      selector: (row) => [row.package?.title],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row?.package?.title}</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "الكمية",
      selector: (row) => [row?.quantity],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.quantity}</span>
        </div>
      ),

      sortable: true,
    },

    {
      name: "عرض",
      selector: (row) => [row.is_active],
      sortable: true,
      cell: (row) => (
        <Link
          className='button-list'
          href={`/dashboard/pages/wating-list/${row.id}/`}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
          >
            <i className={`ti ti-eye btn`}></i>
          </OverlayTrigger>
        </Link>
      ),
    },
  ];

  const tableData = {
    columns,
    data,
  };
  return (
    <>
      <Seo title='قائمة الانتظار' />

      <PageHeader
        title='قائمة الانتظار'
        item='شركة وحيد'
        active_item='قائمة الانتظار'
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex'>
                    <label className='main-content-label my-auto '>
                      قائمة الانتظار
                      <button onClick={()=> forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                                               <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                      </button>
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className='mb-4 d-flex flex-wrap'>
                  {filterdPackages?.map((id, i) => (
                    <Col key={i} sm={12} md={6} lg={6} xl={4}>
                      <Card
                        onClick={() => {
                       
                          setPackData(id)
                          user_type === "ADM" || isCanSendNotification ? setConfirmPopup(true) :''
                        }}
                        className='light'
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Body>
                          <div className='card-order'>
                            <label className='main-content-label mb-3 pt-1'>
                              {getCardData(id)?.title}
                            </label>
                            <h2 className='text-end'>
                              <i className='icon-size ti ti-package float-start text-primary'></i>
                              <span className='font-weight-bold'>
                                {getCardData(id)?.quantity}
                              </span>
                            </h2>
                            <h6
                              className='font-weight-bold '
                              style={{ translate: "0 15px" }}
                            >
                              إجمالي القيمة : {getCardData(id)?.price}
                            </h6>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
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
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
        {confirmPopup && (
        <ConfirmPopup
          loading={loading}
          setConfirmPopup={setConfirmPopup}
          data={packData}
          clearWaitingListSms={clearWaitingListSms}
        />)}

      </div>
     
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
