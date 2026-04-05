import React, { useEffect, useReducer, useState } from "react";

import { Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";


import { useRouter } from "next/router";



import PageHeader from "../../../../../shared/layout-components/page-header/page-header";
import Seo from "../../../../../shared/layout-components/seo/seo";
import { getUserCookies } from "../../../../../utils/getUserCookies";
import dynamic from "next/dynamic";
import Link from "next/link";
import logout from "../../../../../utils/logout";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
const user = getUserCookies();
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const Orders = () => {
  const router = useRouter();
  const { id } = router.query;

  const { token, id: adminId, user_type } = user;

  const [data, setData] = useState(null);
  const [filesData, setFilesData] = useState([]);
  const [deservesData, setDeservesData] = useState([]);
  const [showRecitePopup, setShowRecitePopup] = useState(false);
  const [currentRecite, srtCurrentRecite] = useState();
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);  
  const [perPage, setPerPage] = useState(50);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  useEffect(() => {
    fetch(
      `${baseUrl}/api/v1/admin_sale/${id}/?admin_id=${adminId}&page=${page}&page_size=${perPage}`,
      {
        headers: {
          Authorization: token,
        },
      },
    )
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        console.log(data);
        data && setData(data);
        data && setTotalRows(data.count);
        data && setFilesData(data?.files);
        data && setDeservesData(data?.deserves);
      });
  }, [id ,page]);

  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold d-flex align-items-center gap-2'
         
              >
          <span>{row?.id}</span>
        </div>
   
      ),
    },
   
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'
        onClick={()=>{
          setShowRecitePopup(true)
          srtCurrentRecite(row )
        }}
      
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
           
          >
            <i className={`ti ti-eye btn`} style={{color: "purple", fontSize: 20, position: "relative", right:-8}}></i>
          </OverlayTrigger>
        </div>
      ),
    },

 
  ];
  const deservesColumns = [
    {
      name: "الاسم",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold d-flex align-items-center gap-2'
         
              >
          <span>{row?.user?.name}</span>
          <span>{row?.user?.mobile}</span>
        </div>
   
      ),
    },
    {
      name: "العنصر",
      selector: (row) => [row?.purchase_package_spec?.package_spec],
      sortable: true,
      cell: (row) => (
        <div className=' d-flex align-items-center gap-2'
         
              >
          <span>{row?.purchase_package_spec?.package_spec?.title}</span>
         
        </div>
   
      ),
    },
    {
      name: "الاستحقاق",
      selector: (row) => [row?.deserve],
      sortable: true,
      cell: (row) => (
        <div className=' d-flex align-items-center gap-2'
         
              >
          <span>{row?.deserve.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
         
        </div>
   
      ),
    },
  
   
   

 
  ];
  const tableData = {
    columns,
    data:filesData,
  };
  const deservesTableData = {
    columns:deservesColumns,
    data:deservesData,
  };
  return (
    <>
      <Seo title=' عمليات البيع' />

      <PageHeader
        title=' تفاصيل عملية البيع'
        item='شركة وحيد'
        active_item={" تفاصيل عملية البيع"}
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      تفاصيل عملية البيع
                    </label>
                    {/* <div className='actions'>
                      <Link
                        className='btn btn-primary'
                        href={
                          "/dashboard/pages/users/" + data?.user_id + "/"
                        }
                      >
                        معلومات المشتري
                      </Link>
                      
                    </div> */}
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3 justify-content-between'>
              
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                   التفاصيل
                    </label>
                   
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3'>
                <div className=' d-flex flex-column gap-3'>
                  
                 
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                
                 
                 
                  {/* <label className="app-label"> الحالة: {data?.status}</label> */}
                  <label className='app-label'>
                    {" "}
                    التاريخ :{" "}
                    {new Date(data?.created_at).toLocaleDateString()}
                  </label>

                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
              <Card>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                       الفواتير 
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationPerPage={200}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                  />
                </DataTableExtensions>
              </Card.Body>
              </Card>    
          
          </Col>
        </Row>
        <Row>
          <Col>
              <Card>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                       الاستحقاقات 
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...deservesTableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationServer  
                    paginationTotalRows={totalRows }  
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
        {showRecitePopup && (
          <ShowRecitePopup
          setShowRecitePopup={setShowRecitePopup}
           
            currentRecite={currentRecite}
            
          />
        )}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
const ShowRecitePopup = ({
  setShowRecitePopup,
  currentRecite,

}) => {


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)",overflow:'hidden' }}
      className='pos-fixed top-50 left-50 translate-middle-y   w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "60%", height:'60vh' }}>
        <Card.Body className='text-center ' style={{height:"100%"}}>
          <h4>الفاتورة </h4>
          <div style={{width:"100%" ,height:'80%', overflow:'auto'}}>


          {

            currentRecite.file.split('.')[currentRecite.file.split('.').length -1] == 'pdf' ?  
            
            <iframe style={{width:"100%" ,height:'100%'}} src={`${baseUrl}/${currentRecite.file}`} frameborder="0"></iframe>
            :
            
            <img  src={`${baseUrl}/${currentRecite.file}`} alt=""/>
          }
          </div>
          <div className='d-flex justify-content-center gap-5'>
          
            <button
              className='btn btn-lg btn-outline-dark px-5 mt-2'
              onClick={() => setShowRecitePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};