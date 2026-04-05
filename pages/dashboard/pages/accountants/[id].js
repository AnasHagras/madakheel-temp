import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, Row } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";


const user = getUserCookies();
const Orders = () => {
  const router = useRouter();
  const { id, type } = router.query;

  //const { token, id: adminId, user_type } = user;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [data, setData] = useState({});
  const [deletePopup, setDeletePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // //* Get Accountant Details
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_accountant/${id}/?have_sales_permission=`,{
      headers: {
     
        Authorization: `${user.token}`,
      },

    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => setData(data))
      .catch((err) => console.log(err));
  }, [id]);

  const deleteAccountant = async () => {
    setLoading(true);
    const res = await fetch(
      `${baseUrl}/api/v1/delete_accountant/${id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `${user.token}`,
        },
      },
    );
    if(res.status == 401){
      logout()
    }
    if (res.ok) {
      toast.success("تم الحذف بنجاح");
      router.push("/dashboard/pages/accountants");
    } else {
      toast.error("حدث خطأ ما");
    }
    setDeletePopup(false);
    setLoading(false);
  };

  return (
    <>
      <Seo title='المحاسبون' />

      <PageHeader title='المحاسبون' item='شركة وحيد' active_item={data?.name} />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      المحاسب: {data?.name}
                    </label>
                    {/* {receives?.user && (
                      <Button
                        onClick={() => {
                          setDeserves(receives?.user);
                          setDeserveReciverPopup(true);
                        }}
                      >
                        تعديل المستحفات
                      </Button>
                    )} */}
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
                  <label className='app-label'>
                    مفعل : {data?.is_active ? "نعم" : "لا"}
                  </label>
                  <label className='app-label'>
                    {" "}
                    تاريخ الانضمام :{" "}
                    {new Date(data?.date_joined).toLocaleDateString()}
                  </label>
                  <button
                    className='btn btn-danger w-25'
                    onClick={() => setDeletePopup(true)}
                  >
                    حذف المحاسب
                  </button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
        {deletePopup && (
          <DeletePopup
            setDeletePopup={setDeletePopup}
            loading={loading}
            deleteAccountant={deleteAccountant}
          />
        )}
        {/* <!-- Row --> */}
        {/* <Row className='row-sm'>
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
                  recentPurchases.map((item) => (
                    <Card
                      style={{ minWidth: "300px" }}
                      className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                      key={item?.id}
                    >
                      <label className="app-label">
                        {" "}
                        <span className='font-weight-bold'>
                          المبلغ الإجمالي:
                        </span>{" "}
                        {item?.total_price}
                      </label>
                      <label className="app-label">
                        {" "}
                        <span className='font-weight-bold'>الكمية:</span>{" "}
                        {item?.quantity}
                      </label>
                      <label className="app-label">
                        {" "}
                        <span className='font-weight-bold'>
                          سعر الوحدة:
                        </span>{" "}
                        {item?.unit_price}
                      </label>
                      <label className="app-label">
                        {" "}
                        <span className='font-weight-bold'>الربح:</span>{" "}
                        {item?.profit}
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
                  ))
                ) : (
                  <h4>لم يتم إضافة عمليات شراء مؤخرًا</h4>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row> */}
        {/* <!-- End Row --> */}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const DeletePopup = ({ setDeletePopup, loading, deleteAccountant }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من حذف المحاسب </h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => deleteAccountant()}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الحذف ..." : "حذف"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setDeletePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
