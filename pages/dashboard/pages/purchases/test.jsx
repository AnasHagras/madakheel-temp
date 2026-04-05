import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
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
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import { getUserCookies } from "../../../../utils/getUserCookies";
import { getFormatedTime } from "../../../../utils/getFormatedTime";
import logout from "../../../../utils/logout";
let html2pdf;
if (typeof window !== 'undefined') {
  html2pdf = require('html2pdf.js');
}

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
  const [renewPopup, setRenewPopup] = useState(false);
  const [updateQuantityPopup, setUpdateQuantityPopup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [amounts, setAmounts] = useState({})
  const [isCanUpdateAndConfirmRecite, setIsCanUpdateAndConfirmRecite] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowPurchasesFiles, setIsCanShowPurchasesFiles] = useState(false);

  useEffect(() => {
    if ( user_type === "ACC") {
    const permissions =  JSON.parse(localStorage.getItem("permissions"))
    const componentPermissions = permissions?.filter(
      (permission) => permission.group_name === 'عمليات الشراء'
    );
    const canUpdateAndConfirmRecite = componentPermissions?.some((permission) => permission.display_name === 'تأكيد وتعديل مبلغ الإيصال');
    const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
    const showPurchasesFiles = componentPermissions?.some((permission) => permission.display_name === "عرض مستندات الشراء" );
    setIsCanUpdateAndConfirmRecite(canUpdateAndConfirmRecite);
    setIsCanShowPurchasesFiles(showPurchasesFiles);
    setIsCanUpdate(canUpdate);
  }
  }, [user]);
  //* Get Purchase Details
  useEffect(() => {
    if (id) {
      fetch(`${baseUrl}/api/v1/get_purchase_detail/${id}/?admin_id=` + adminId, {
        headers: { "Authorization": token }
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
          console.log(data);
          setData(data[0]);
          setSpecs(data[0].purchase_package_specs);
          setPayments(data[0].payments);

          const initAmounts = {};
          setReciteData(
            data[0].Receipt.map((el) => {
              initAmounts[el.id] = el.amount;
              el.editable = el.amount > 0 ? false : true
              return el

            })
          )
          setAmounts(initAmounts)
          console.log(reciteData);

        });
    }
  }, [id, update]);



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
      case "PENDING":
        return " btn-warning_";
      case "UPLOADED_FILE":
        return " btn-secondary_";
      case "PAID_PARTIALLY":
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
      name: "الايصال",
      selector: (row) => [row?.created_at],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'><span className="font-weight-bold">ايصال</span> {row?.created_at.split("T")[0]} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "الملف",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (
        <div
          onClick={() => {

            setShowRecitePopup(true)
            srtCurrentRecite(row)

          }
          }
          className='font-weight-bold text-primary cursor-pointer '>عرض الملف</div>
      ),
    },

    {
      name: "المبلغ",
      selector: (row) => [row?.amount],
      cell: (row) => (
        <div className='font-weight-bold d-flex justify-content-center'>

          <span >

            <input onChange={(e) => { setCurrentReciteAmount(e.target.value); const cAmount = {}; cAmount[row.id] = e.target.amount; setAmounts({ ...amounts, ...cAmount }) }} className={!row?.editable ? "bg-light form-control " : " border  "} type="text" name="" id="" readOnly={!row?.editable} value={amounts[row?.id] ? (!row?.editable ? amounts[row?.id].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : amounts[row?.id]) : null} />
          </span>
        </div>
      ),
      sortable: true,
    },
    user_type === "ADM" || isCanUpdateAndConfirmRecite ?
    {
      name: "التأكيد",
      selector: (row) => [row?.amount],
      sortable: true,
      cell: (row) => (
        <div className='font-weight-bold'>
          {!row?.editable && row?.amount ?

            <Button disabled={data?.status == "PAID" ? true : false}

              onClick={() => {

                srtCurrentRecite(row)
                setEditeRecitePopup(true)
                console.log(row);



              }
              }
            >
              تعديل القيمة

            </Button>
            :
            <Button disabled={data?.status == "PAID" ? true : false}

              onClick={() => {

                setSubmitRecitePopup(true)
                srtCurrentRecite(row)



              }
              }
            >
              تأكيد وتسجيل القيمة

            </Button>

          }
        </div>
      ),
    }
    :
    '',
    // {
    //   name: "الكمية",
    //   selector: (row) => [row?.quantity],
    //   sortable: true,
    //   cell: (row) => <div>{row?.quantity}</div>,
    // },


  ];
 

  const tableData = {
    columns,
    data: reciteData,
  };


  const [modalContent, setModalContent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const statusClass = getStatusClass(data?.status);
 


  const handleSetSubmitPopup = () => {
    if (data?.remaining_amount > 0) {
      toast.error("   لم يتم دفع المبلغ بالكامل  ");

    }
    else {
      setSubmitPopup(true)
    }
  }
  const printDocument = () => {
    console.log(';;;;;;;;;;;;;;;;');
    const element = document.getElementById('modal-content');
    const opt = {
      margin: 0,
      filename: 'download.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

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
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      <span> شراء من :  </span>

                      <span className="mr-2">
                        <Link
                          href={`/dashboard/pages/packages/${data?.Package?.id}/`}
                        >
                          {data?.Package?.title}
                        </Link>
                      </span>
                    </label>
                  </div>
                  <div className="d-flex flex-wrap gap-2 ">
                    {
                     user_type === "ADM" || isCanUpdate ?
                      <>
                      
                    <Button
                      className='mx-3'
                      onClick={() => setUpdateQuantityPopup(true)}
                    >
                      تعديل الكمية
                    </Button>
                    <Button
                      className='mx-3'
                      onClick={() => setUpdateQuantityPopup(true)}
                    >
                       add file 
                    </Button>
                
                      </>
                      :
                      ''

                    }
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3 justify-content-between'>
                <div className=' d-flex flex-1 flex-column gap-3'>
                  {/* <label className="app-label">{"عملية شراء: " + data?.Package?.title}</label> */}
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                  <Link
                    className='app-label'
                    href={"/dashboard/pages/users/" + data?.user_id + "/"}
                  >
                    {data?.user?.name} - <span dir="ltr"><span><img className="" src={`${baseUrl}/${data?.user?.country_code?.flag_image}`} alt=""  style={{width:'30px' }}/></span> {data?.user?.country_code?.code}{' '} {data?.user?.mobile}</span>
                  </Link>
                  <label className='app-label'> الكمية: {data?.quantity}</label>
                  <label className='app-label'> التقييم: {data?.rating}</label>
                  <label className='app-label'>
                    {" "}
                    السعر: {data?.total_price?.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </label>
                  {/* <label className="app-label"> الربح: {data?.profit}</label> */}
                  {/* <label className="app-label"> نقاط البيع: {data?.sale_pointer}</label> */}
                  {/* <label className="app-label"> نسبة الضريبة: {data?.vat_percentage}</label> */}
                  <label className='app-label'>
                    {" "}
                    الحالة:{" "}
                    <button className={statusClass}>
                      {data?.status === "NEW"
                        ? "جديد غير مدفوع"
                        : data?.status === "PAID"
                          ? "مدفوعة"
                          : data?.status === "REJECTED"
                            ? "مرفوضة"
                            : data?.status === "SOLD"
                              ? "مبيعة كاملة"
                              : data?.status === "PENDING"
                                ? "انتظار"
                                : data?.status === "UPLOADED_FILE"
                                  ? "تم رفع الإيصال"
                                  : data?.status === "SOLD_PARTIALLY"
                                    ? "قائمة"
                                    : data?.status === "CANCELLED"
                                      ? "ملغية"
                                      : data?.status === "PAID_PARTIALLY"
                                        ? "مدفوع جزئيا"
                                        : data?.status === "PAYMENT_INITIATED"
                                          ? " تمت محاولة الدفع"
                                          : data?.status}
                    </button>
                  </label>
                  {data?.Receipt?.file && (
                    <>
                      <Link
                        href={"/" + data?.Receipt?.file}
                        target='_blank'
                        referrerPolicy='no-referrer'
                        className='app-label link'
                      >
                        فتح ملف الإيصال بصفحة مستقلة
                      </Link>
                      {/* <iframe src={'/'+data?.Receipt?.file} frameborder="0" height="500"></iframe> */}
                    </>
                  )}
                  <label className='app-label'>
                    {" "}
                    تاريخ الإنشاء: {data?.datetime}
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
                <h3 style={{ color: "var(--primary-bg-color)" }}>اللإيصالات</h3>
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
            
          

              <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' style={{ overflowX: 'scroll' }}>
                <Modal.Header closeButton>
                  <Modal.Title>تفاصيل الفاتورة</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div id="modal-content" dangerouslySetInnerHTML={{ __html: modalContent }}></div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant='secondary' onClick={() => setShowModal(false)}>
                    غلق
                  </Button>
                  <Button variant='primary' onClick={() => printDocument()}>
                    طباعة
                  </Button>
                </Modal.Footer>
              </Modal>

            </Card>
          </Col>
        </Row>


    
        {updateQuantityPopup && (
          <UpdateQuantityPopup
            setUpdateQuantityPopup={setUpdateQuantityPopup}
            token={token}
            id={id}
            adminId={adminId}
            forceUpdate={forceUpdate}
            q={data?.quantity}
          />
        )}

  
   
    
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;


const UpdateQuantityPopup = ({
  setUpdateQuantityPopup,
  token,
  id,
  adminId,
  forceUpdate,
  q,
}) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(q);
  const [note, setNote] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const updateQuantity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("quantity", quantity);
    fd.append("notes", note);

    const res = await fetch(
      `${baseUrl}/api/v1/sale_employee/update_purchase_quantity/${id}/?employee_id=${adminId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `${token}`,
        },
        body: fd,
      },
    );
    if(res.status == 401){
      logout()
    }
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      toast.success("تم  تعديل الكمية بنجاح");
      setUpdateQuantityPopup(false);
      forceUpdate();
    } else {
      toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من تعديل الكمية </h4>

          <Form onSubmit={(e) => updateQuantity(e)}>
            <Form.Group className='text-start form-group'>
              <Form.Label>الكمية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الكمية الجديدة'
                name='reason'
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className='text-start form-group'>
              <Form.Label>الملاحظات</Form.Label>
              <Form.Control
                className='form-control'
                placeholder=' الملاحظات'
                name='reason'
                type='text'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </Form.Group>

            <div className='d-flex justify-content-center gap-5'>
              <button
                className='btn btn-lg btn-danger px-5 '
                onClick={() => { }}
                disabled={loading}
                style={{ minWidth: "fit-content" }}
                type='submit'
              >
                {loading ? "جاري التعديل ..." : "تعديل"}
              </button>
              <button
                className='btn btn-lg btn-outline-dark px-5'
                type='button'
                onClick={() => setUpdateQuantityPopup(false)}
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


