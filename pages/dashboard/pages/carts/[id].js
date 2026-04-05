import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import receipt from "../../../../public/assets/img/receipt.svg";
import socument from "../../../../public/assets/img/socument.svg";
import card from "../../../../public/assets/img/card.svg";
import creditCardIcon from "../../../../public/assets/img/creditCard.jpeg";
import appledIcon from "../../../../public/assets/img/apple.png";
import dynamic from "next/dynamic";
// import html2pdf from 'html2pdf.js';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
const html2pdf = dynamic(() => import("html2pdf.js"), {
  ssr: false,
});
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import { getUserCookies } from "../../../../utils/getUserCookies";
import { getFormatedTime } from "../../../../utils/getFormatedTime";


const user = getUserCookies();

const Orders = () => {
  const router = useRouter();
  const { id } = router.query;
  const [reciteData, setReciteData] = useState([]);
  const { token, id: adminId, user_type } = user;

  const [data, setData] = useState(null);
  const [submitPopup, setSubmitPopup] = useState(false);
  const [submitRecitePopup, setSubmitRecitePopup] = useState(false);
  const [editeRecitePopup, setEditeRecitePopup] = useState(false);
  const [showRecitePopup, setShowRecitePopup] = useState(false);
  const [currentRecite, srtCurrentRecite] = useState();
  const [currentReciteAmount, setCurrentReciteAmount] = useState(0);
  const [specs, setSpecs] = useState([]);
  const [rejectPopup, setRejectPopup] = useState(false);
  const [updateQuantityPopup, setUpdateQuantityPopup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  const [amounts, setAmounts] = useState({})
  //* Get Purchase Details
  useEffect(() => {
    if (id) {
      fetch(`http://192.34.59.161/api/v1/carts/${id}/`, {
        headers: { "Authorization": token }
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setData(data)

        });
    }
  }, [id, update]);




  const columns = [
    {
      name: "الرقم التسلسلي",
      selector: (row) => [row?.id],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.id} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: " الكمية",
      selector: (row) => [row?.quantity],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.quantity} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: " اسم المنتج",
      selector: (row) => [row?.product],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.product.name} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: " الصورة",
      selector: (row) => [row.product],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
            {/* <img src={row.image} className="header-brand-img desktop-logo" alt="logo1" height="35" style="transform: scale(2.5);" /> */}
            <img
              src={row?.product?.images[0]?.image}
              className='my-3'
              alt='logo'
              height={100}
            />
          </span>
        </div>
      ),

      sortable: true,
    },
 
    {
      name: "سعر المنتج",
      selector: (row) => [row?.product],
      sortable: true,
      cell: (row) => <div>{row?.product.price}</div>,
    },


  ];

  const tableData = {
    columns,
    data: data?.items,
  };
 

  const [modalContent, setModalContent] = useState('');
  const [showModal, setShowModal] = useState(false)



  return (
    <>
      <Seo title='عمليات الشراء' />

      <PageHeader
        title='عمليات الشراء'
        item='شركة وحيد'
        active_item={"عملية شراء " + data?.Package?.title}
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div className='d-flex justify-content-between'>
            
                
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3 justify-content-between'>
                <div className=' d-flex flex-1 flex-column gap-3'>
                  {/* <label className="app-label">{"عملية شراء: " + data?.Package?.title}</label> */}
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                  <Link
                    className='app-label'
                    href={"/" }
                  >
                    {data?.user?.name} - {data?.user?.phone_number}
                  </Link>
                  <label className='app-label'> عدد المنجات: {data?.items.length}</label>
                  <label className='app-label'>
                    {" "}
                    السعر: {data?.total_price.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </label>
                  {/* <label className="app-label"> الربح: {data?.profit}</label> */}
                  {/* <label className="app-label"> نقاط البيع: {data?.sale_pointer}</label> */}
                  {/* <label className="app-label"> نسبة الضريبة: {data?.vat_percentage}</label> */}
                 
                 
                  <label className='app-label'>
                    {" "}
                    تاريخ الإنشاء: {data?.created_at}
                  </label>

                </div>
                {/* <div className=' d-flex flex-1 flex-column gap-3'>
                  <label className="app-label">{"البلد: " + data?.country}</label>
                  <label className="app-label">لمنطقة: {data?.region}</label>
                  <label className="app-label"> المدينة: {data?.city}</label>
                  <label className="app-label"> الشارع: {data?.street}</label>
                  <label className="app-label"> الرمز البريدي: {data?.postal_code}</label>
                </div> */}
              </Card.Body>
            
            
              <Card.Header className=' border-bottom-0 pb-0'>
                <h3 style={{ color: "var(--primary-bg-color)" }}>المنتجات</h3>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                  // striped={true}

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

Orders.layout = "Contentlayout";

export default Orders;


