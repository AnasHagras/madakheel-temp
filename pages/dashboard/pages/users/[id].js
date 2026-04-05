import React, { useEffect, useReducer, useState, useRef } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Accordion,
  Button,
  Card,
  Col,
  Form,
  Modal,
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
  const previousUrlRef = useRef(null);

  //const { token, id: adminId, user_type } = user;

  const [data, setData] = useState({});
  const [userData, setUserData] = useState({});
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [messages, setMessages] = useState([]);
  const { token, id: adminId, user_type } = user;
  const [reply, setReply] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [loading, setLoading] = useState(false);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanAdd, setIsCanAdd] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowFiles, setIsCanShowFiles] = useState(false);
  const [isCanShowPurchases, setIsCanShowPurchases] = useState(false);
  const [isCanShowContact, setIsCanShowContact] = useState(false);
  const [isCanSendContact, setIsCanSendContact] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to get stored purchases index URL (with filters) from sessionStorage
    const storedUrl = sessionStorage.getItem('purchasesIndexUrl');
    if (storedUrl) {
      previousUrlRef.current = storedUrl;
    }
  }, []);
  useEffect(() => {
    if (user_type === "ACC") {

      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'العملاء'
      );

      const purchasesPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات الشراء'
      );
      const contactPermissions = permissions?.filter(
        (permission) => permission.group_name === 'رسائل الدعم'
      );

      console.log('componentPermissions', componentPermissions);
      const canShowPurchases = purchasesPermissions?.some((permission) => permission.display_name === 'عرض');
      const canShowContact = contactPermissions?.some((permission) => permission.display_name === 'عرض');
      const canSendContact = contactPermissions?.some((permission) => permission.display_name === 'تعديل');
      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'عرض');
      const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const canShowFiles = componentPermissions?.some((permission) => permission.display_name === 'عرض');
      setIsCanShowPurchases(canShowPurchases);
      setIsCanShowContact(canShowContact);
      setIsCanSendContact(canSendContact);
      setIsCanAdd(canAdd);
      setIsCanDelete(canDelete);
      setIsCanUpdate(canUpdate);
      setIsCanShowFiles(canShowFiles);
    }
  }, [user]);
  // //* Get User Details
  const handleReplyMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {

      const res = await fetch(`${baseUrl}/api/v1/sale_admin_customer/${id}/`, {

        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          "notes": reply,


        }),
      });
      const result = await res.json();
      if (res.status == 401) {
        logout()
      }
      if (res.status == 200) {

        setReply('')
        setLoading(false);
        forceUpdate(update + 1);
        toast.success("تم الرد بنجاح   .");
        router.push("/dashboard/pages/users/");

      }
      else {
        toast.error(result.message || "حدث خطأ في الرد.");
        setLoading(false);
      }
      const data = await res.json();
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
    }


  }
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {

      const res = await fetch(`${baseUrl}/api/v1/contact_customer_support/`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          "response": adminMessage,
          "user_id": id,


        }),
      });
      const result = await res.json();
      if (res.status == 401) {
        logout()
      }
      if (res.status == 200 || res.status == 201) {

        setAdminMessage('')
        setLoading(false);
        forceUpdate(update + 1);
        toast.success(result.message);


      }
      else {
        toast.error(result.message || "حدث خطأ في الرد.");
        setLoading(false);
      }
      const data = await res.json();
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
    }


  }
  const handleUpdateUser = async (updatedData) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/admin_users/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(updatedData),
      });
      const result = await res.json();
      if (res.status === 200) {
        toast.success("تم تحديث بيانات العميل بنجاح");
        setData(result.data); // Update the local state with the new data
        forceUpdate(); // Force re-render
      } else {
        toast.error(result.message || "حدث خطأ أثناء التحديث");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user_type === "ADM" || user_type === "ACC") {


      fetch(`${baseUrl}/api/v1/customer/${id}/`, {

        headers: { "Authorization": token }
      })
        .then((res) => {
          // if (res.status === 401) {
          //   logout();
          //   return;
          // }
          return res.json();
        })
        .then((data) => setData(data.data))
        .catch((err) => console.log(err));
    }


    if (user_type === "SALE") {


      fetch(`${baseUrl}/api/v1/sale_admin_customer/${id}/`, {


        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {

          setUserData(data)
          setData(data.customer)
        }
        )
    }
    fetch(`${baseUrl}/api/v1/contact_customer_support/?user_id=${id}&message_type=all`, {


      headers: {
        Authorization: ` ${user.token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        return res.json();
      })
      .then((data) => {

        setMessages(data?.results)

      }
      )

  }, [id, update]);

  //* Get Recent Purchases
  useEffect(() => {

    user_type === "ADM" || isCanShowPurchases || user_type === "SALE" ?
      fetch(`${baseUrl}/api/v1/get_recent_purchases/?customer_id=${userData.customer ? userData.customer?.id : id}`, {


        headers: { "Authorization": token }
      })
        .then((res) => res.json())
        .then((data) => setRecentPurchases(data))
        .catch((err) => console.log(err)) : ''
  }, [id, userData]);
  const toggleActivation = (status) => {
    const base = status ? "deactivate" : "activate"
    fetch(`${baseUrl}/api/v1/users/${id}/${base}/`, {
      method: "POST",
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
        if (data.success) {
          toast.success(data.message)
        }
        else toast.error(data.error)

        fetch(`${baseUrl}/api/v1/customer/${id}/`, {
          headers: { "Authorization": token }
        })
          .then((res) => res.json())
          .then((data) => setData(data.data))
          .catch((err) => console.log(err));
      })
      .catch((err) => toast.error(err.error));

  }
  const toggleVerification = (status) => {
    const base = status ? false : true
    fetch(`${baseUrl}/api/v1/admin_users/${data.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        is_verified: base
      }),
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
        "Accept": "application/json"

      }
    })
      .then((res) => {
        if (res.status === 401) {
          // logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.success) {
          toast.success(data.message)
        }
        else toast.error(data.error)

        forceUpdate()
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
      case "PAID_PARTIALLY":
        return " btn-secondary_";
      case "PAYMENT_INITIATED":
        return " btn-dark_";
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
    <div style={{ position: 'relative' }}>
      <Seo title='العملاء' />

      <PageHeader title='العملاء' item='شركة وحيد' active_item={data?.name} />

      <div >
        <div
          className='d-flex justify-content-between align-items-center mb-3'
          style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => {
              const backUrl = previousUrlRef.current || '/dashboard/pages/purchases';
              router.push(backUrl);
            }}
            className="d-flex align-items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            العودة إلى عمليات الشراء
          </Button>
        </div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between flex-wrap gap-4'>
                    <label className='main-content-label my-auto pt-2'>
                      العميل: {data?.name}
                    </label>
                    <div className="d-flex gap-2 flex-wrap">

                      {user_type === "ADM" || isCanUpdate  ?
                        <>
                          <Button
                            variant="primary"
                            onClick={() => setShowUpdateModal(true)}
                          >
                            تعديل بيانات العميل
                          </Button>

                        </>
                        : ''
                      }
                      {user_type === "ADM" || isCanUpdate || user_type === "SALE" ?
                        <>
                          <Button
                            onClick={() => {
                              toggleVerification(data?.is_verified)
                            }}
                          >
                            {data?.is_verified ? ' إلغاء  التوثيق' : " توثيق"}
                          </Button>

                        </>
                        : ''
                      }
                      {user_type === "ADM" || isCanUpdate ?
                        <>
                          <Button
                            onClick={() => {
                              toggleActivation(data?.is_active)
                            }}
                          >
                            {data?.is_active ? 'ايقاف المستخدم' : "تفعيل المستخدم"}
                          </Button>

                        </>
                        : ''
                      }
                      {
                        user_type === "ADM" || isCanShowFiles ?

                          <Button
                            onClick={() => {
                              router.push("/dashboard/pages/users/report/?id=" + id);
                            }}
                          >
                            كشف الحساب للعميل
                          </Button>
                          : ""
                      }
                    </div>

                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3'>
                <div className='flex-1 d-flex flex-column gap-3'>
                  <label className='app-label'>الاسم: {data?.name}</label>
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                  <label className='app-label'>
                    رقم الهاتف: <span dir="ltr"><span><img className="" src={`${baseUrl}/${data?.country_code?.flag_image}`} alt="" style={{ width: '30px' }} /></span> {data?.country_code?.code}{' '} {data?.mobile}</span>
                  </label>
                  <label className='app-label'>
                    {" "}
                    الهوية: {data?.national_id}
                  </label>
                  <label className='app-label'>
                    البريد الالكتروني : {data?.email}
                  </label>
                  <label className='app-label'>
                    رقم الآيبان : {data?.iban}
                  </label>
                  <label className='app-label'>
                    اسم البنك : {data?.bank_name}
                  </label>
                  <label className='app-label'>المدينة : {data?.city}</label>
                  <label className='app-label'>
                    {" "}
                    المنطقة : {data?.region}
                  </label>
                  <label className="app-label">
                    موظفوا المبيعات  :
                    {data?.sale_admins?.length > 0 ? (
                      data.sale_admins
                        .map((admin) => admin.name)
                        .join(" - ")
                    ) : (
                      <span> لا يوجد موظفين مبيعات </span>
                    )}
                  </label>
                  <label className="app-label">
                    المشرفين :
                    {data?.accountants?.length > 0 ? (
                      data.accountants
                        .map((accountant) => accountant.name)
                        .join(" - ")
                    ) : (
                      <span> لا يوجد مشرفين </span>
                    )}
                  </label>

                  <label className='app-label'>
                    {" "}
                    تاريخ الانضمام :{" "}
                    {new Date(data?.date_joined).toLocaleDateString()}
                  </label>
                  {
                    user_type === "SALE" &&
                    <label className='app-label'>
                      {" "}
                      الملاحظة : {data?.notes}
                    </label>
                  }

                  <label className='app-label'>
                    {" "}

                    الحالة : {data?.is_active ? <span className="btn-success_ text-success font-weight-bold">
                      مفعل
                    </span> : <span className="btn-danger_ text-danger font-weight-bold">
                      معطل
                    </span>}
                  </label>
                  <label className='app-label'>
                    {" "}

                    التوثيق : {data?.is_verified ? <span className="btn-success_ text-success font-weight-bold">
                      موثق
                    </span> : <span className="btn-danger_ text-danger font-weight-bold">
                      غير موثق
                    </span>}
                  </label>
                </div>
              </Card.Body>
              {user_type === "SALE" && userData.status == 'NEW' ?

                <Col lg={8} md={8}>
                  <Card.Body>
                    <Form
                      onSubmit={(e) =>
                        handleReplyMessage(e)
                      }
                    >


                      <Form.Group
                        className='text-start form-group'
                        controlId='formpassword'
                      >
                        <Form.Label>  إرسال الملاحظة</Form.Label>
                        <textarea
                          className='form-control'
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          rows={5}
                          placeholder='ادخل الملاحظة'
                        />
                      </Form.Group>

                      <Button
                        disabled={loading}
                        type='submit'
                        className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                      >
                        {loading ? "جار الإرسال..." : "  إرسال الرد"}
                      </Button>


                    </Form>
                  </Card.Body>

                </Col>
                : ''
              }
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}

        {/* <!-- Row --> */}
        {user_type === "ADM" || isCanShowPurchases || user_type === "SALE" ?

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
                    recentPurchases.map((item) => {
                      const statusClass = getStatusClass(item?.status);
                      return (
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
                          {
                            user_type === "ADM" &&
                          <label className='app-label'>
                            {" "}
                            <span className='font-weight-bold'>رقم الشراء:</span>{" "}
                            {item?.id}
                          </label>
                          }
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
                          {
                            user_type === "SALE" &&

                          <label className='app-label'>
                            {" "}
                            <span className='font-weight-bold'>تاريخ الانشاء:</span>{" "}
                            {item?.datetime}
                          </label>
                          }
                          {/* <label className='app-label'>
                            {" "}
                            <span className='font-weight-bold'>
                              سعر الوحدة:
                            </span>{" "}
                            {item?.unit_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </label> */}
                          <label className='app-label'>
                            {" "}
                            الحالة:{" "}
                            <span className={statusClass}>
                              {item?.status === "NEW"
                                ? "جديد غير مدفوع"
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
                                              : item?.status === "PAID_PARTIALLY"
                                                ? "مدفوع جزئيا"
                                                : item?.status === "PAYMENT_INITIATED"
                                                  ? " تمت محاولة الدفع"
                                                  : item?.status}
                            </span>
                          </label>
                          {/* <label className='app-label'>
                            {" "}
                            <span className='font-weight-bold'>الربح:</span>{" "}
                            {item?.profit?.toFixed(2)}
                          </label> */}
                          {
                            user_type === "SALE" ?
''

                            :


                          <div className='actions d-flex gap-3 '>
                            <Link
                              style={{ fontSize: "16px" }}
                              className='btn btn-primary px-4 py-2 rounded-5'
                              href={"/dashboard/pages/purchases/" + item?.id}
                            >
                              المزيد من التفاصيل
                            </Link>
                          </div>
                          }
                        </Card>
                      )
                    })
                  ) : (
                    <h4>لم يتم إضافة عمليات شراء مؤخرًا</h4>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          : ''
        }
        {/* <!-- End Row --> */}

        {
          user_type === "ADM" || isCanShowContact ?
            <Row className='row-sm'>
              <Col md={12} lg={12}>
                <Card className=' custom-card'>
                  <Card.Header className=' border-bottom-0 pb-0'>
                    <div>
                      <div className='d-flex justify-content-between'>
                        <label className='main-content-label my-auto pt-2'>
                          رسائل العميل
                        </label>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className=' d-flex gap-2 flex-wrap  row'>
                    {
                      user_type === "ADM" || isCanSendContact ?
                        <div className="col-12 col-md-5">
                          <Card.Body>
                            <Form
                              onSubmit={(e) =>
                                handleSendMessage(e)
                              }
                            >


                              <Form.Group
                                className='text-start form-group'
                                controlId='formpassword'
                              >
                                <Form.Label>  إرسال رسالة للعميل</Form.Label>
                                <textarea
                                  className='form-control'
                                  value={adminMessage}
                                  onChange={(e) => setAdminMessage(e.target.value)}
                                  rows={5}
                                  placeholder='رسالة تصل للعميل '
                                />
                              </Form.Group>

                              <Button
                                disabled={loading}
                                type='submit'
                                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                              >
                                {loading ? "جار الإرسال..." : "  إرسال "}
                              </Button>


                            </Form>
                          </Card.Body>
                        </div>

                        : ''
                    }
                    <div className='accordion-container col-md-6'>
                      <h4 className="mb-2">الرسائل السابقة</h4>
                      <Accordion defaultActiveKey="0" className="mt-4 ">
                        {messages?.length > 0 ?
                          messages?.map((item, index) => {
                            // Extract date and time from datetime
                            const [date, time] = item.datetime.split("T");
                            const formattedTime = time.split(".")[0]; // Remove milliseconds

                            return (
                              <Accordion.Item eventKey={index.toString()} key={item.id}>
                                <Accordion.Header>
                                  <h5 className="mb-0"> {item?.id} </h5>
                                  <h5 className="mb-0 ms-4"> {date} </h5>
                                  <h5 className="mb-0 ms-4"> {formattedTime} </h5>
                                </Accordion.Header>
                                <Accordion.Body>

                                  <div
                                    className=""
                                    style={{
                                      padding: "10px 20px",
                                    }}
                                  >
                                    {item.message_type == "SUPPORT" &&

                                      <div className="mb-2">

                                        <span>رسالة العميل</span> : <span>{item.message || "N/A"}</span>
                                      </div>
                                    }
                                    <div className="mb-2">
                                      <span>رسالة المشرف</span> : <span>{item.response || "N/A"}</span>
                                    </div>
                                    {item.message_type == "SUPPORT" &&

                                      <div>
                                        <span>ملاحظة المشرف</span> : <span>{item.admin_notes || "N/A"}</span>
                                      </div>
                                    }
                                  </div>
                                </Accordion.Body>
                              </Accordion.Item>
                            );
                          })

                          :
                          <div className="d-flex justify-content-center align-items-center p-5">لا يوجد رسائل</div>
                        }
                      </Accordion>
                    </div>

                  </Card.Body>
                </Card>
              </Col>
            </Row>
            : ''
        }
        {/* Update User Modal */}
        <UpdateUserModal
          show={showUpdateModal}
          handleClose={() => setShowUpdateModal(false)}
          userData={data}
          handleUpdate={handleUpdateUser}
        />
      </div>
    </div>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const UpdateUserModal = ({ show, handleClose, userData, handleUpdate }) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    national_id: userData?.national_id || "",
    email: userData?.email || "",
    nationality_id: userData?.nationality_id || "",
    region_id: userData?.region_id || "",
    city_id: userData?.city_id || "",
    bank_name: userData?.bank_name || "",
   
  });

  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cities, regions, and nationalities from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with your API endpoints
        const citiesResponse = await fetch(`${baseUrl}/api/v1/city/?region_id=${formData?.region_id}`);
        const regionsResponse = await fetch(`${baseUrl}/api/v1/region/`);
        const nationalitiesResponse = await fetch(`${baseUrl}/api/v1/nationality/`);

        const citiesData = await citiesResponse.json();
        const regionsData = await regionsResponse.json();
        const nationalitiesData = await nationalitiesResponse.json();

        setCities(citiesData.data || []);
        setRegions(regionsData.data || []);
        setNationalities(nationalitiesData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formData?.region_id]);

  // Update form data when userData changes
  useEffect(() => {
    setFormData({
      name: userData?.name || "",
      national_id: userData?.national_id || "",
      email: userData?.email || "",
      nationality_id: userData?.nationality_id || "",
      region_id: userData?.region_id || "",
      city_id: userData?.city_id || "",
      bank_name: userData?.bank_name || "",
     
    });
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdate(formData);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>تعديل بيانات العميل</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>رقم الهوية</Form.Label>
              <Form.Control
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </div>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>البريد الإلكتروني</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>الجنسية</Form.Label>
              <Form.Select
                name="nationality_id"
                value={formData.nationality_id}
                onChange={handleChange}
                className="form-control "
                style={{ paddingRight: '35px', paddingLeft: "5px" }}
                required
              >
                <option value="">اختر الجنسية</option>
                {nationalities.map((nationality) => (
                  <option key={nationality.id} value={nationality.id}>
                    {nationality.name_ar}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>المنطقة</Form.Label>
              <Form.Select
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}
                className="form-control "
                style={{ paddingRight: '35px', paddingLeft: "5px" }}
                required
              >
                <option value="">اختر المنطقة</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>المدينة</Form.Label>
              <Form.Select
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
                className="form-control "
                style={{ paddingRight: '35px', paddingLeft: "5px" }}  
                required
              >
                <option value="">اختر المدينة</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.nameAr}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>اسم البنك</Form.Label>
              <Form.Control
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                required
              />
            </Form.Group>
       
          </div>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "جاري التحميل..." : "حفظ التعديلات"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
