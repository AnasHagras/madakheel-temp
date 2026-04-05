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
import { useEffect, useRef, useState } from "react";
// import Dashboard from "../pages/dashboard/dashboard/dashboard"

//Images
import logolight from "../../../public/assets/img/brand/oboorlogo-white.svg";

import { useRouter } from "next/router";

const Home = () => {

  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [err, setError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [btnTxt, setBtnTxt] = useState("تأكيد الرمز  ");


  const router = useRouter();

  const handleSubmit = async (e, otpNum) => {
    e.preventDefault();
    setLoading(true);


    const mobile = localStorage.getItem('attemptMobile')
    const user_type = localStorage.getItem('user_type')
    const countryCode = localStorage.getItem('country_code')
    const response = await fetch(`${baseUrl}/api/v1/reset_password_token/`, {
      method: "POST",
      body: JSON.stringify({
        otp: otpNum,
        mobile: mobile,
        user_type: user_type,
        country_code:JSON.parse(countryCode)
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {

    });
    const data = await response?.json();
    console.log(';;;;;;;;;;;;;', data);

    setLoading(false);
    data.success === true
      ? goToOtp(data?.data)
      : setError(" رمز التحقق غير صحيح أو انتهت المدة الزمنية");

  };

  const goToOtp = (data) => {

    localStorage.setItem("token", data.token)
    router.push("/dashboard/pages/createNewPassword/")

  }

  const OtpInput = ({ setOtp }) => {
    const [activeInput, setActiveInput] = useState(0);
    const inputRefs = useRef([]);

    useEffect(() => {
      inputRefs.current[0].focus();
    }, []);

    const handleInputChange = (index, event) => {
      const value = event.target.value;

      if (value.length === 1 && index < 3) {
        inputRefs.current[index + 1].focus();
        setActiveInput(index + 1);
      }
      if (value.length === 0 && index > 0) {
        inputRefs.current[index - 1].focus();
        setActiveInput(index - 1);
      }
      if (index === 3 && value.length === 1) {
        setOtp(getOtpValue());
        console.log(getOtpValue());
        handleSubmit(event, getOtpValue());
      }
    };

    const handleBackspace = (index, event) => {
      const value = event.target.value;
      if (event.key === 'Backspace' && value.length === 0 && index > 0) {
        console.log(index - 1);
        inputRefs.current[index - 1].focus();
        setActiveInput(index - 1);
      }
    };

    const getOtpValue = () => {
      let otp = '';
      inputRefs.current.forEach((input) => {
        otp += input.value;
      });
      return otp;
    };

    return (
      <div className="row py-5" style={{ direction: 'ltr' }}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="col m-0 p-0">
            <input
              ref={(ref) => (inputRefs.current[index] = ref)}
              type="text"
              maxLength="1"
              className={`form-control py-4 text-center ${activeInput === index ? 'border-primary' : ''
                }`}
              onChange={(event) => handleInputChange(index, event)}
              onKeyDown={(event) => handleBackspace(index, event)}
            />
          </div>
        ))}
      </div>
    );
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
              <Row className='row-sm '>
                <Col
                  lg={6}
                  xl={5}
                  className='d-none d-lg-flex justify-content-center  text-center bg-primary details'
                >
                  <div className='mt-4 p-2 pos-absolute '>
                    <img
                      src={logolight.src}
                      className='header-brand-img mb-4'
                      alt='logo-light'
                      height={100}
                    />
                    <div className='clearfix'></div>
                    {/* <img src={user.src} className='ht-100 mb-0' alt='user' /> */}
                    <h5 className='mt-4 text-white'>رمز التحقق الثنائي</h5>

                  </div>
                </Col>
                <Col lg={6} xl={7} xs={12} sm={12} className='login_form '>
                  <Container fluid className="p-3 ">
                    <Row className='row-sm '>
                      <Card.Body className='mt-2 mb-2 '>
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
                        <Form onSubmit={(e) => handleSubmit(e)} className="d-flex justify-content-center align-items-center flex-column">
                          <h5 className='text-start mb-2 text-primary font-weight-bold fs-3'>
                            ادخل رمز التحقق
                          </h5>
                          <p className='mb-4 text-muted tx-13  text-center'>
                            تم إرسال رمز التحقق إلى جوالك المسجل
                          </p>

                          <OtpInput setOtp={setOtp} />

                          <Button
                            disabled={loading}
                            type='submit'
                            className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                          >
                            {loading ? "جار التحقق ..." : `${btnTxt}`}
                          </Button>
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
