import Seo from '../../../../shared/layout-components/seo/seo'
import PageHeader from '../../../../shared/layout-components/page-header/page-header'
import React, { useEffect, useState } from "react";
import { Card, Col, FormGroup, Row, Form, Switch } from "react-bootstrap";
import { toast } from "react-toastify";
import { getUserCookies } from '../../../../utils/getUserCookies';
import logout from '../../../../utils/logout';


function Index() {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [payments, setPayments] = useState([]);
  const [androidLink, setAndroidLink] = useState('');
  const [iosLink, setIosLink] = useState('');
  const [appVersion, seAppVersion] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [file, setFile] = useState(null);
  const [showAdvertisement, setShowAdvertisement] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const user = getUserCookies();
  const { token, id, user_type } = user;
  const [isCanUpdate, setIsCanUpdate] = useState(false);


  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'اعدادات التطبيق'
      );

      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');


      setIsCanUpdate(canUpdate);
    }
  }, [user]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getUserCookies();
        setAdmin(user);

        const res = await fetch(`${baseUrl}/api/v1/app-settings/`, {
          headers: {
            Authorization: ` ${user.token}`,
          },
        });
        if (res.status == 401) {
          logout()
        }
        const data = await res.json();

        setInfo(data.data);
        setPayments(data.data.payment_types);
        setAndroidLink(data.data.android_link);
        setIosLink(data.data.ios_link);
        seAppVersion(data.data.app_version);
        setImgUrl(`${baseUrl}/${data.data.banner}`);
        setShowAdvertisement(data.data.is_banner_active);
      } catch (error) {
        toast.error("حدث خطأ ما حاول مرة أخرى");
      }
    };

    fetchData();
  }, []);

  const handleChangeImage = (e) => {
    setFile(e.target.files[0]);
    setImgUrl(URL.createObjectURL(e.target.files[0]));
  };
  const handlePaymentChange = (e) => {
    const { name, checked } = e.target;
    setPayments((prevPayments) =>
      prevPayments.map((payment) =>
        payment.name === name ? { ...payment, enabled: checked } : payment
      )
    );
  };
  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    const paymentForm = new FormData();
    const fd = new FormData();
    fd.append("android_link", androidLink);
    fd.append("ios_link", iosLink);
    fd.append("app_version", appVersion);
    fd.append("is_banner_active", showAdvertisement);

    if (file) {
      fd.append("banner", file);
    }

    try {
      for (const payment of payments) {
        paymentForm.append("enabled", payment.enabled);

        await fetch(`${baseUrl}/api/v1/payment/payment-types/${payment.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: admin.token,
          },
          body: paymentForm,
        });
      }
      const res = await fetch(
        `${baseUrl}/api/v1/app-settings/1/`,
        {
          method: "PATCH",
          body: fd,
          headers: {
            Authorization: admin.token,
          },
        }
      );
      if (res.status == 401) {
        logout()
      }
      const result = await res.json();

      if (res.status === 200) {
        toast.success("تم تحديث بيانات التطبيق بنجاح");
      } else {
        toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
      }
    } catch (error) {
      toast.error("حدث خطأ ما حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  if (!info) {
    return <p>Loading...</p>; // Add a loader or placeholder if needed
  }

  return (
    <>
      <Seo title="اعدادات التطبيق" />
      <PageHeader title="التطبيق" item="شركة وحيد" active_item="التطبيق" />
      <div>
        <Row className="row-sm">
          <Col lg={12} md={12}>
            <Form onSubmit={submitForm}>
              <Card className="custom-card">
                <Card.Body>
                  <FormGroup className="form-group">
                    <Form.Label>نسخة الاصدار</Form.Label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="نسخة الاصدار"
                      value={appVersion}
                      onChange={(e) => seAppVersion(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="form-group">
                    <Form.Label>رابط الأندرويد</Form.Label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="رابط الأندرويد"
                      value={androidLink}
                      onChange={(e) => setAndroidLink(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="form-group">
                    <Form.Label>رابط الios</Form.Label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="رابط الios"
                      value={iosLink}
                      onChange={(e) => setIosLink(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup className="form-group mb-2">
                    <Form.Label>ظهور الأعلان</Form.Label>
                    <Switch
                      id="showAdvertisementSwitch"
                      className="ms-5"
                      checked={showAdvertisement}
                      onChange={() => setShowAdvertisement(!showAdvertisement)}
                    />
                  </FormGroup>
                  <FormGroup className="form-group mt-5">
                    <Form.Label>الشعار</Form.Label>
                    <img
                      src={imgUrl}
                      className="my-3"
                      alt="logo"
                      height={150}
                    />
                    <input
                      onChange={handleChangeImage}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="form-control"
                    />
                  </FormGroup>
                  <FormGroup className='form-group'>
                    <h6 className='font-weight-bold mb-3'> طرق الدفع </h6>
                    {payments.map((payment, index) => {
                      return (
                        <div key={index} className='form-check form-check-inline d-flex flex-column align-items-start'>
                          <img
                            src={`${baseUrl}${payment?.icon_file}`}
                            className='my-3'
                            alt='logo'
                            height={100}
                          />
                          <div className="d-flex align-items-center">

                            <input
                              className='form-check-input fs-4'
                              type='checkbox'
                              id={payment.id}
                              name={payment.name}
                              value={payment.id}
                              checked={payment.enabled}
                              onChange={(e) => handlePaymentChange(e)}
                            />
                            <label className='form-check-label fs-4' htmlFor={payment.id}>
                              {payment.name}
                            </label>
                          </div>

                        </div>
                      )
                    })}
                  </FormGroup>
                  <hr />
                </Card.Body>
                {
                  isCanUpdate || user_type === "ADM" ?

                    <div className="card-footer">
                      <button
                        disabled={loading}
                        className="btn btn-primary btn-lg me-3 px-5"
                      >
                        {loading ? "جاري الحفظ ..." : "حفظ"}
                      </button>
                    </div>
                    : ''
                }
              </Card>
            </Form>
          </Col>
        </Row>
      </div>
    </>
  );
}

Index.layout = "Contentlayout";
export default Index;
