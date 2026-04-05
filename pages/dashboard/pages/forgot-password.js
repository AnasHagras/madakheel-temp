import Head from "next/head";
import {
  Button,
  Col,
  Form,
  Row,
  Alert,
  Container,
  Card,
} from "react-bootstrap";
import styles from "../../../styles/Home.module.scss";
import favicon from "../../../public/assets/img/brand/favicon.ico";
import { useEffect, useState } from "react";
// import Dashboard from "../pages/dashboard/dashboard/dashboard"

//Images
import logolight from "../../../public/assets/img/brand/oboorlogo-white.svg";

import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Link from "next/link";


const Home = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [err, setError] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBg1, setActiveBg1] = useState("primary");
  const [activeText1, setActiveText1] = useState("white");
  const [activeBg2, setActiveBg2] = useState("green");
  const [activeText2, setActiveText2] = useState("black");
  const [activeBg3, setActiveBg3] = useState("green");
  const [activeText3, setActiveText3] = useState("black");
  const [UserType, setUserType] = useState("ADM");

  const [btnTxt, setBtnTxt] = useState("تسجيل الدخول كمشرف");
  const [countryCode, setCountryCode] = useState([]);
  const [selectedCode, setSelectedCode] = useState(1); // Default to Saudi Arabia

  const router = useRouter();
  useEffect(() => {


    const fetchCountryCode = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/country-code/`, {

        });
        const data = await res.json();
        console.log(data);

        setCountryCode(data);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryCode();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = await fetch(`${baseUrl}/api/v1/reset_password/`, {
      method: "POST",
      body: JSON.stringify({
        mobile,
        user_type: UserType
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {

    });
    const data = await response.json();

    setLoading(false);
    console.log(data);
    data.success === true
      ? goToOtp(data?.data, mobile)
      : setError(data.message);
    setMobile("");

  };
  const goToOtp = () => {
    localStorage.setItem("user_type", UserType)
    localStorage.setItem("attemptMobile", mobile)
    localStorage.setItem("country_code", selectedCode)
    router.push("/dashboard/pages/verifyResetPassword/")

  }

  const chooseAdmin = () => {
    setBtnTxt("تسجيل الدخول كمشرف");
    setActiveBg2("green");
    setActiveText2("black");
    setActiveBg3("green");
    setActiveText3("black");
    setActiveBg1("primary");
    setActiveText1("white");

    setUserType("ADM");
  };

  const chooseAccountant = () => {
    setBtnTxt("تسجيل الدخول كمحاسب");
    setActiveBg2("primary");
    setActiveText2("white");
    setActiveBg1("green");
    setActiveText1("black");
    setActiveBg3("green");
    setActiveText3("black");

    setUserType("ACC");
  };

  const chooseSalesEmployee = () => {
    setBtnTxt("تسجيل الدخول كموظف المبيعات");
    setActiveBg3("primary");
    setActiveText3("white");
    setActiveBg2("green");
    setActiveText2("black");
    setActiveBg1("green");
    setActiveText1("black");

    setUserType("SALE");
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>شركة وحيد</title>
        <meta name='description' content='شركة وحيد' />
        <link rel='icon' href={favicon.src} />
      </Head>
      <div className='page main-signin-wrapper'>
        <Row className='signpages text-center'>
          <Col md={12}>
            <Card>
              <Row className='row-sm'>
                <Col
                  lg={6}
                  xl={5}
                  className='d-none d-lg-block text-center bg-primary details'
                >
                  <div className='mt-4 p-2 pos-absolute'>
                    <img
                      src={logolight.src}
                      className='header-brand-img mb-4'
                      alt='logo-light'
                      height={100}
                    />
                    <div className='clearfix'></div>
                    {/* <img src={user.src} className='ht-100 mb-0' alt='user' /> */}
                    <h5 className='mt-4 text-white'>  استعادة كلمة السر الخاصة بك </h5>
                    <span className='tx-white-6 tx-13 mb-5 mt-xl-0'>
                      سجل رقم الجوال الخاص بحسابك لتتمكن من متابعة اعادة ادخال كلمة السر
                    </span>
                  </div>
                </Col>
                <Col lg={6} xl={7} xs={12} sm={12} className='login_form '>
                  <Container fluid>
                    <Row className='row-sm'>
                      <Card.Body className='mt-2 mb-2'>
                        {/* <img
                          src={logo.src}
                          className=' d-lg-none header-brand-img text-start float-start mb-4 auth-light-logo'
                          alt='logo'
                        /> */}
                        <img
                          src={logolight.src}
                          className=' d-lg-none header-brand-img text-start float-start mb-4 auth-dark-logo'
                          alt='logo'
                        />
                        <div className='clearfix'></div>
                        {err && <Alert variant='danger'>{err}</Alert>}
                        <Form onSubmit={(e) => handleSubmit(e)}>
                          <h5 className='text-start mb-2'>
                            استعادة كلمة السر الخاصة بك
                          </h5>
                          <p className='mb-4 text-muted tx-13 ms-0 text-start'>
                            ادخال رقم الجوال
                          </p>
                          <Form.Group
                            className='text-start form-group'
                            controlId='formEmail'
                          >
                            <Form.Label>رقم الجوال</Form.Label>
                            <div className="d-flex gap-1">
                              <Form.Select
                                value={selectedCode}
                                onChange={(e) => setSelectedCode(e.target.value)}
                                className="form-control w-25"
                                style={{ paddingRight: '35px', paddingLeft: "5px" }}
                              >
                                {countryCode.map((country) => (
                                  <option key={country.id} value={country.id} className="p-4">
                                    ({country.code})
                                  </option>
                                ))}
                              </Form.Select>
                              <Form.Control
                                className="form-control w-75"
                                placeholder="ادخل رقم الجوال"
                                name="mobile"
                                type="text"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                              />
                            </div>
                          </Form.Group>

                          <div className='d-flex justify-content-center gap-4 py-2'>
                            <button
                              type='button'
                              onClick={chooseAdmin}
                              className={`px-4 py-2 bg-${activeBg1} text-${activeText1} border-0 rounded `}
                            >
                              إدارة
                            </button>
                            <button
                              type='button'
                              onClick={chooseAccountant}
                              className={`px-4 py-2 bg-${activeBg2} text-${activeText2} border-0 rounded `}
                            >
                              مشرف
                            </button>
                            <button
                              type='button'
                              onClick={chooseSalesEmployee}
                              className={`px-4 py-2 bg-${activeBg3} text-${activeText3} border-0 rounded `}
                            >
                              موظف مبيعات
                            </button>
                          </div>
                          <Button
                            disabled={loading}
                            type='submit'
                            className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                          >
                            {loading ? "جار الحصول علي الرمز..." : `الحصول علي الرمز`}
                          </Button>
                          {/* <div className="d-flex mt-2">
                            <p className='text-muted text-center tx-13'>
                              هل نسيت كلمة المرور ؟
                            </p>
                            <Link href='/dashboard/pages/forgot-password/'>استعادة كلمة المرور</Link>
                          </div> */}
                        </Form>
                        <div className='text-start mt-5 ms-0' />
                      </Card.Body>
                    </Row>
                  </Container>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};
Home.layout = "Authenticationlayout";

export default Home;
