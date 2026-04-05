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
import trash from "../../../../public/assets/img/trash.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";




const user = getUserCookies();
const Orders = () => {
  const router = useRouter();
  const { id, type } = router.query;

  //const { token, id: adminId, user_type } = user;
  const { token, user_type } = user;
  const [data, setData] = useState({});
  const [deletePopup, setDeletePopup] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanSendNotification, setIsCanSendNotification] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);


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
  useEffect(() => {
    id && 
    fetch(`${baseUrl}/api/v1/waiting_list/${id}/` ,{
    
      headers: {
  
        Authorization: ` ${user?.token}`,
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
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      <Link href={`/dashboard/pages/users/${data?.user?.id}`}>
                        العميل: {data?.user?.name}
                      </Link>
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
                  <label className='app-label'>الاسم: {data?.user?.name}</label>

                  <label className='app-label'>
                    رقم الهاتف: {data?.user?.mobile}
                  </label>

                  <label className='app-label'>
                    البريد الالكتروني : {data?.user?.email}
                  </label>

                  <label className='app-label'>
                    الباقة : {data?.package?.title}
                  </label>

                  <label className='app-label'>الكمية : {data?.quantity}</label>
                  {
                     user_type === "ADM" || isCanUpdate ?

                  <button
                    className='btn btn-danger w-25'
                    onClick={() => setDeletePopup(true)}
                  >
                    حذف
                  </button>
                     :
                     ''
                  }
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
      {deletePopup && <DeletePopup setDeletePopup={setDeletePopup} id={id} />}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const DeletePopup = ({ setDeletePopup, id }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`${baseUrl}/api/v1/waiting_list/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: ` ${user?.token}`,
      },
    });
    if(res.status == 401){
      logout()
    }
    if (res.status > 200 && res.status < 300) {
      toast.success("تم الحذف بنجاح");
      setDeletePopup(false);
      setLoading(false);
      router.push("/dashboard/pages/wating-list");
    } else {
      toast.error("حدث خطأ ما");
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من الحذف </h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => handleDelete()}
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
