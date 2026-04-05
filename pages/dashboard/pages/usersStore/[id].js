import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";


const user = getUserCookies();
const Orders = () => {
  const router = useRouter();
  const { id, type } = router.query;

  //const { token, id: adminId, user_type } = user;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [data, setData] = useState({});
  const [recentPurchases, setRecentPurchases] = useState([]);
  const { token, id: adminId, user_type } = user;
  // //* Get User Details
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/customer/${id}/` ,{
      headers: { "Authorization": token }
    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => setData(data.data))
      .catch((err) => console.log(err));
  }, [id]);

  //* Get Recent Purchases
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_recent_purchases/?customer_id=${id}`)
      .then((res) => res.json())
      .then((data) => setRecentPurchases(data))
      .catch((err) => console.log(err));
  }, [id]);
  const toggleActivation = (status) => {
    const base = status ? "deactivate"   :"activate" 
    fetch(`${baseUrl}/api/v1/users/${id}/${base}/` ,{
      method: "POST"  ,
      headers: { "Authorization": token }
    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        console.log(data);
        if(data.success){
          toast.success(data.message)
        }
        else toast.error(data.error)

        fetch(`${baseUrl}/api/v1/customer/${id}/` ,{
          headers: { "Authorization": token }
        })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
          .then((data) => setData(data.data))
          .catch((err) => console.log(err));
      })
      .catch((err) => toast.error(err.error));

  }
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
      case "SOLD_PARTIALLY":
        return " btn-info_"; // Example, change as needed
      case "CANCELLED":
        return " btn-dark_";
      default:
        return " btn-light_"; // Default color
    }
  };
  console.log(recentPurchases);
  return (
    <>
      <Seo title='العملاء' />

      <PageHeader title='العملاء' item='شركة وحيد' active_item={data?.name} />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      العميل: {data?.name}
                    </label>
                    <Button
                      onClick={() => {
                        toggleActivation(data?.is_active)
                      }}
                    >
                      {data?.is_active ? 'ايقاف المستخدم':"تفعيل المستخدم"}
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/dashboard/pages/users/report/?id=" + id);
                      }}
                    >
                      كشف الحساب للعميل
                    </Button>
                  
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3'>
                <div className='flex-1 d-flex flex-column gap-3'>
                  <label className='app-label'>الاسم: {data?.name}</label>
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                  <label className='app-label'>
                    رقم الهاتف: {data?.mobile}
                  </label>
                  <label className='app-label'>
                    {" "}
                    الهوية: {data?.national_id}
                  </label>
                  <label className='app-label'>
                    البريد الالكتروني : {data?.email}
                  </label>
                  <label className='app-label'>المدينة : {data?.city_id}</label>
                  <label className='app-label'>
                    {" "}
                    المنطقة : {data?.region_id}
                  </label>
                  <label className='app-label'>
                    {" "}
                    تاريخ الانضمام :{" "}
                    {new Date(data?.date_joined).toLocaleDateString()}
                  </label>
                
                  <label className='app-label'>
                    {" "}
                   
                     الحالة : {data?.is_active ?  <span className="btn-success_ text-success font-weight-bold">
                    مفعل
                    </span>: <span className="btn-danger_ text-danger font-weight-bold">
                    معطل
                    </span>}
                  </label>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      عمليات الشراء الأخيرة{" "}
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-2 flex-wrap '>
                {recentPurchases.length > 0 ? (
                  recentPurchases.map((item) =>{ 
                    const statusClass = getStatusClass(item?.status);
                    return(
                    <Card
                      style={{ minWidth: "300px" }}
                      className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                      key={item?.id}
                    >
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'>الباقة:</span>{" "}
                        {item?.Package?.title}
                      </label>
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'>
                          المبلغ الإجمالي:
                        </span>{" "}
                        {item?.total_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </label>
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'>الكمية:</span>{" "}
                        {item?.quantity}
                      </label>
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'>
                          سعر الوحدة:
                        </span>{" "}
                        {item?.unit_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </label>
                      <label className='app-label'>
                        {" "}
                        الحالة:{" "}
                        <span className={statusClass}>
                        {item?.status === "NEW"
                          ? "جديد"
                          : item?.status === "PAID"
                            ? "مدفوعة"
                            : item?.status === "REJECTED"
                              ? "مرفوضة"
                              : item?.status === "SOLD"
                                ? "مبيعة كاملة"
                                : item?.status === "PENDING"
                                  ? "انتظار"
                                  : item?.status === "UPLOADED_FILE"
                                    ? "تم رفع الإيصال"
                                    : item?.status === "SOLD_PARTIALLY"
                                      ? "قائمة"
                                      : item?.status === "CANCELLED"
                                        ? "ملغية"
                                        : item?.status}
                      </span>
                      </label>
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'>الربح:</span>{" "}
                        {item?.profit?.toFixed(2)}
                      </label>

                      <div className='actions d-flex gap-3 '>
                        <Link
                          style={{ fontSize: "16px" }}
                          className='btn btn-primary px-4 py-2 rounded-5'
                          href={"/dashboard/pages/purchases/" + item?.id}
                        >
                          المزيد من التفاصيل
                        </Link>
                      </div>
                    </Card>
                  )})
                ) : (
                  <h4>لم يتم إضافة عمليات شراء مؤخرًا</h4>
                )}
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

const ImagePopup = ({ img, setImg }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>صورة الهوية</h4>
          <img
            src={"https://taami.org" + img}
            alt='stop'
            className='my-4 mw-100'
          />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setImg(false)}
            >
              إغلاق
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
